'use client';

import { useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';
import { useMuro, VentanaMuro, type AutorMuro, type PublicacionMuro } from '../../../simuladores/muro';

/**
 * N7·«Ciudadanía digital crítica» · «Privacidad en redes» — tercera y
 * última clase de la tanda sobre `simuladores/muro/`, y la única que usa
 * `perfilDe()`/`pistas`: el alumno audita su propio perfil viéndolo como lo
 * vería un desconocido (`perfilDe(alumno, { visibilidad: ['publico'] })`),
 * cerrando o borrando lo que sobra.
 *
 * La consecuencia diferida más fuerte de las tres clases vive aquí: una de
 * las publicaciones (la de la calle) ya llevaba semanas pública cuando el
 * alumno por fin la borra. `borrar()` la saca del perfil auditado de
 * inmediato —la herramienta sí sirve—, pero un turno después (clic en
 * «Seguir», nunca automático) `inyectarConsecuencia({ tipo: 'copia' })`
 * revela que alguien ya la había visto antes: el mismo mecanismo de
 * «borrar no borra» que enseñó `n5-lo-que-publico-permanece`, un nivel más
 * arriba y con el alumno auditando su propio pasado en vez de reaccionar en
 * el momento.
 */

const ALUMNO: AutorMuro = { id: 'yo', nombre: 'Dana', usuario: '@dana.rk', avatar: '🧑', esAlumno: true };

const POST_ESCUELA: PublicacionMuro = {
  id: 'post-escuela',
  autor: ALUMNO,
  texto: 'Primer día en la Secundaria Benito Juárez, turno matutino 🎒',
  fecha: 'Hace 4 meses',
  visibilidad: 'publico',
  meGusta: 12,
  comentarios: [],
  compartidos: 0,
  acciones: ['me-gusta', 'comentar'],
  copiasSobrevivientes: [],
  pistas: ['Estudia en la Secundaria Benito Juárez, turno matutino'],
};

const POST_MASCOTA: PublicacionMuro = {
  id: 'post-mascota',
  autor: ALUMNO,
  texto: 'Feliz cumpleaños a mi perro Rocko, mi mejor amigo desde que tengo memoria 🐶🎂',
  fecha: 'Hace 2 meses',
  visibilidad: 'publico',
  meGusta: 20,
  comentarios: [],
  compartidos: 0,
  acciones: ['me-gusta', 'comentar'],
  copiasSobrevivientes: [],
  pistas: ['El nombre de su mascota es Rocko — una respuesta típica de pregunta de seguridad'],
};

const POST_CALLE: PublicacionMuro = {
  id: 'post-calle',
  autor: ALUMNO,
  texto: 'Ya casi llego, vivo a dos cuadras del parque Los Naranjos y siempre regreso solo a las 3 🏃',
  fecha: 'Hace 6 semanas',
  visibilidad: 'publico',
  meGusta: 4,
  comentarios: [],
  compartidos: 0,
  acciones: ['me-gusta', 'comentar'],
  copiasSobrevivientes: [],
  pistas: ['Vive cerca del parque Los Naranjos y llega solo a casa a las 3'],
};

const POST_LOGRO: PublicacionMuro = {
  id: 'post-logro',
  autor: ALUMNO,
  texto: 'Gané el concurso de matemáticas de la zona escolar 🏆',
  fecha: 'Hace 3 semanas',
  visibilidad: 'publico',
  meGusta: 31,
  comentarios: [],
  compartidos: 0,
  acciones: ['me-gusta', 'comentar'],
  copiasSobrevivientes: [],
};

type Fase = 'inicio' | 'auditar-escuela' | 'auditar-mascota' | 'auditar-calle' | 'seguir-calle' | 'cierre';

const TOTAL_PASOS = 5;

export function LabPrivacidadEnRedes(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, TOTAL_PASOS, {});
  const muro = useMuro({ alumno: ALUMNO, publicaciones: [POST_ESCUELA, POST_MASCOTA, POST_CALLE, POST_LOGRO] });

  const [fase, setFase] = useState<Fase>('inicio');
  const [historial, setHistorial] = useState<string[]>([
    'Éste es tu perfil visto como lo vería alguien que no te conoce: sólo lo público cuenta.',
  ]);

  const decir = (linea: string) => setHistorial((prev) => [...prev, linea]);

  const empezar = () => {
    labActividad.avanzar();
    setFase('auditar-escuela');
  };

  const dejarPublica = (nombre: string) => {
    decir(`La dejaste como estaba. La publicación ${nombre} sigue sumando una pista al perfil público — puedes volver a decidir cuando quieras.`);
  };

  const escuelaAAmigos = () => {
    muro.cambiarVisibilidad(POST_ESCUELA.id, 'amigos');
    decir('Cambiaste la publicación de la escuela a "Sólo amigos". Un desconocido ya no puede leerla — sigue siendo tuya, sólo que para tu círculo real.');
    labActividad.avanzar();
    setFase('auditar-mascota');
  };

  const borrarMascota = () => {
    muro.borrar(POST_MASCOTA.id);
    decir('Borraste la publicación del cumpleaños de Rocko. El nombre de una mascota es justo el tipo de dato que se usa como respuesta de seguridad — mejor que no esté público.');
    labActividad.avanzar();
    setFase('auditar-calle');
  };

  const borrarCalle = () => {
    muro.borrar(POST_CALLE.id);
    decir('Borraste la publicación sobre la calle y el horario. Ya no aparece en tu perfil auditado.');
    labActividad.avanzar();
    setFase('seguir-calle');
  };

  const seguirDesdeCalle = () => {
    muro.inyectarConsecuencia({
      tipo: 'copia',
      publicacionId: POST_CALLE.id,
      copia: { texto: 'Cuenta_Nueva21 ya había visto esta publicación hace semanas, antes de que la borraras.' },
    });
    decir('Borrar la sacó de tu perfil de hoy — pero alguien ya la había visto hace semanas, y eso no se deshace. Por eso auditar sirve más seguido: evita que la vea alguien más a partir de AHORA, aunque no borre lo ya visto.');
    labActividad.avanzar();
    setFase('cierre');
  };

  const terminar = () => {
    /*
     * CORREGIDO 1-sep-2026 (auditoría). Decía `labActividad.pasos * 20`: un
     * tiempo fabricado a partir del número de pasos, no jugado. Su clase
     * hermana `LabEquilibrioDigital` presume en su propio comentario de NO
     * hacer esto; ésta lo hacía. Se mide igual que ella.
     */
    const s = labActividad.sim.current.inicio;
    labActividad.terminar(s === 0 ? 0 : Math.round((Date.now() - s) / 1000));
  };

  const perfilPublico = useMemo(
    () => muro.perfilDe(ALUMNO, { visibilidad: ['publico'] }),
    [muro],
  );

  if (labActividad.terminado) {
    return (
      <VentanaBase marca="Tecnia Muro" subtitulo="Privacidad en redes">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">🕶️</p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Sabe auditar su perfil</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Tu perfil público ya suelta menos pistas que antes. Auditar no borra lo que ya se vio, pero sí evita que
            lo vea alguien más desde hoy — y eso no es poca cosa.
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
    <VentanaBase marca="Tecnia Muro" subtitulo="Privacidad en redes">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 p-4 sm:p-6">
        <div>
          <VentanaMuro vista="perfil" perfil={perfilPublico} />
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
            <button type="button" onClick={empezar} className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Empezar auditoría
            </button>
          )}

          {fase === 'auditar-escuela' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wide text-cyan-300 font-bold">Publicación 1 de 3 · La escuela</p>
              <button type="button" onClick={() => dejarPublica('de la escuela')} className="px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold text-left">
                La dejo pública
              </button>
              <button type="button" onClick={escuelaAAmigos} className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-left">
                Cambiar a Sólo amigos
              </button>
            </div>
          )}

          {fase === 'auditar-mascota' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wide text-cyan-300 font-bold">Publicación 2 de 3 · La mascota</p>
              <button type="button" onClick={() => dejarPublica('de la mascota')} className="px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold text-left">
                La dejo pública
              </button>
              <button type="button" onClick={borrarMascota} className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-left">
                Borrar publicación
              </button>
            </div>
          )}

          {fase === 'auditar-calle' && (
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wide text-cyan-300 font-bold">Publicación 3 de 3 · La calle</p>
              <button type="button" onClick={() => dejarPublica('de la calle')} className="px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold text-left">
                La dejo pública
              </button>
              <button type="button" onClick={borrarCalle} className="px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-left">
                Borrar publicación
              </button>
            </div>
          )}

          {fase === 'seguir-calle' && (
            <button type="button" onClick={seguirDesdeCalle} className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
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

export default LabPrivacidadEnRedes;
