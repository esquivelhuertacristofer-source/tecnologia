'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';
import {
  BandejaMuro,
  ETIQUETA_MOTIVO,
  useMuro,
  VentanaMuro,
  type AccionMuro,
  type AutorMuro,
  type ContactoMuro,
  type MotivoReporte,
  type PublicacionMuro,
  type ReporteEnCurso,
  type Visibilidad,
} from '../../../simuladores/muro';

/**
 * N6 · «Ciberseguridad» · «Privacidad en redes y juegos» — reescrita el
 * 6-oct-2026 (DOCUMENTO-MAESTRO §69.2).
 *
 * Antes: «ajustar la visibilidad» era un botón del panel, el correcto en
 * esmeralda, y al publicar avanzaba cualquiera de los tres. Ahora todo pasa
 * en Tecnia Muro: la audiencia se cambia en el selector de cada publicación,
 * se elige ANTES en el del compositor, y «Así te ve un desconocido» enseña
 * las pistas que deja el perfil público. Tres misiones, cada una dice el
 * resultado y se cumple leyendo el muro.
 *
 * Como en el resto de las clases de ciudadanía digital de la casa, nada resta
 * puntos: el costo es la consecuencia (el desconocido que insiste, el
 * «me gusta» de alguien que no conoces, lo que ya vio y no se des-ve).
 */

const ALUMNO: AutorMuro = { id: 'yo', nombre: 'Ary', usuario: '@ary_2013', avatar: '🙂', esAlumno: true };
const NOCTURNO: AutorMuro = { id: 'nocturno', nombre: 'Jugador_Nocturno', avatar: '🌙' };
const DESCONOCIDO: AutorMuro = { id: 'desconocido-77', nombre: 'Usuario_77', avatar: '👤' };

export const CONTACTOS: ContactoMuro[] = [
  { id: 'mama', nombre: 'Mamá', avatar: '👩', relacion: 'adulto' },
  { id: 'leo', nombre: 'Leo', avatar: '🎮', relacion: 'amigo' },
  { id: 'tio', nombre: 'Tío Beto', avatar: '🧔', relacion: 'adulto' },
  { id: 'nocturno', nombre: 'Jugador_Nocturno', avatar: '🌙', relacion: 'otro' },
];

const ID_HORARIO = 'horario-online';
const ID_ESCUELA = 'primer-dia';
const ID_DIBUJO = 'dragon';
const ID_COMENTARIO = 'c-nocturno';
const ID_TORNEO = 'torneo';

const PUBLICACIONES: PublicacionMuro[] = [
  {
    id: ID_HORARIO,
    autor: ALUMNO,
    texto: 'Juego en línea todos los días de 6 a 8 de la noche 🎮 ¡Únanse!',
    fecha: 'Ayer',
    visibilidad: 'publico',
    meGusta: 3,
    comentarios: [],
    compartidos: 0,
    acciones: ['me-gusta', 'borrar'],
    copiasSobrevivientes: [],
    pistas: ['Está en línea todos los días de 6 a 8 de la noche'],
  },
  {
    id: ID_ESCUELA,
    autor: ALUMNO,
    texto: '¡Primer día en la Secundaria 14! 🎒',
    imagen: { emoji: '🏫', descripcion: 'Ary con el uniforme, frente a la puerta de la Secundaria 14' },
    fecha: 'Hace una semana',
    visibilidad: 'publico',
    meGusta: 12,
    comentarios: [],
    compartidos: 0,
    acciones: ['me-gusta', 'borrar'],
    copiasSobrevivientes: [],
    pistas: ['Va a la Secundaria 14'],
  },
  {
    id: ID_DIBUJO,
    autor: ALUMNO,
    texto: 'Terminé mi dragón 🐉 ¿Le pongo alas más grandes?',
    imagen: { emoji: '🐉', descripcion: 'Un dragón verde dibujado con plumones' },
    fecha: 'Hace dos semanas',
    visibilidad: 'publico',
    meGusta: 20,
    comentarios: [],
    compartidos: 1,
    acciones: ['me-gusta', 'borrar'],
    copiasSobrevivientes: [],
  },
];

const MOTIVOS: MotivoReporte[] = ['no-me-gusta', 'spam', 'acoso', 'datos-personales'];

export const MISION_1 = 'Que un desconocido no pueda saber cuándo juegas ni a qué escuela vas, sin esconder lo que no hace falta esconder.';
export const MISION_2 = 'Jugador_Nocturno te escribió por Mensajes. Haz lo que harías para protegerte.';
export const MISION_3 = 'Quieres invitar a tus amigos a tu torneo de mañana. Publícalo para que lo vean ellos y nadie más.';

type Acto = 'inicio' | 'uno' | 'dos' | 'tres' | 'cierre';
type Vista = 'muro' | 'desconocido' | 'perfil' | 'mensajes';

const esAdulto = (id: string) => CONTACTOS.find((c) => c.id === id)?.relacion === 'adulto';
const palabras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export function LabPrivacidadEnJuegos(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, 3);
  const muro = useMuro({ alumno: ALUMNO, publicaciones: PUBLICACIONES, contactos: CONTACTOS });

  const [acto, setActo] = useState<Acto>('inicio');
  const [vista, setVista] = useState<Vista>('muro');
  const [perfilDe, setPerfilDe] = useState<AutorMuro | null>(null);
  const [reporte, setReporte] = useState<{ publicacionId: string; comentarioId?: string } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [borrador, setBorrador] = useState('');
  const [adjuntos, setAdjuntos] = useState<string[]>([]);
  const [publicacion, setPublicacion] = useState('');
  const [audiencia, setAudiencia] = useState<Visibilidad>('publico');
  /** Con qué audiencia NACIÓ cada torneo publicado (la misión 3 lo mide al publicar, no después). */
  const [nacidas, setNacidas] = useState<Record<string, Visibilidad>>({});
  const [historial, setHistorial] = useState<string[]>([
    'Éste es tu muro. Tres publicaciones tuyas, las tres en «🌐 Público»: cualquiera las puede leer, no sólo tus amigos.',
  ]);
  const dichos = useRef(new Set<string>());
  const intentosTorneo = useRef(0);
  const decir = (l: string) => setHistorial((prev) => [...prev, l]);
  const decirUnaVez = (k: string, l: string) => {
    if (dichos.current.has(k)) return;
    dichos.current.add(k);
    decir(l);
  };

  // ── Lo que dice el estado del muro ──
  const perfilPublico = muro.perfilDe(ALUMNO, { visibilidad: ['publico'] });
  const dibujo = muro.publicaciones.find((p) => p.id === ID_DIBUJO);
  const horario = muro.publicaciones.find((p) => p.id === ID_HORARIO);
  const comentario = horario?.comentarios.find((c) => c.id === ID_COMENTARIO);
  /* Cualquier comentario suyo cuenta: si en la misión 1 se borró el horario, su comentario se fue con él,
     y el del dragón (que llega con la misión 2) sigue ahí para reportarlo. */
  const reportadoPorDatos = muro.publicaciones.some((p) =>
    p.comentarios.some((c) => c.autor.id === NOCTURNO.id && c.motivoReporte === 'datos-personales'),
  );
  const nocturnoBloqueado = muro.bloqueados.includes(NOCTURNO.id);

  const mision1 = {
    sinHorario: !perfilPublico.pistas.some((p) => p.includes('6 a 8')),
    sinEscuela: !perfilPublico.pistas.some((p) => p.includes('Secundaria 14')),
    dibujoPublico: Boolean(dibujo && !dibujo.borrada && dibujo.visibilidad === 'publico'),
  };
  const mision1Cumplida = mision1.sinHorario && mision1.sinEscuela && mision1.dibujoPublico;

  const mision2 = {
    bloqueo: nocturnoBloqueado,
    reporte: reportadoPorDatos,
    adulto: muro.mensajes.some((m) => m.delAlumno && esAdulto(m.conversacion) && palabras(m.texto) >= 2),
  };
  const mision2Cumplida = mision2.bloqueo && mision2.reporte && mision2.adulto;

  const torneoBien = Object.entries(nacidas).some(([id, v]) => {
    const p = muro.publicaciones.find((x) => x.id === id);
    return v === 'amigos' && p && !p.borrada && p.visibilidad === 'amigos';
  });
  const mision3Cumplida = torneoBien;

  const avanzado = useRef({ uno: false, dos: false, tres: false });
  const { avanzar } = lab;
  useEffect(() => {
    const marcas: Array<[Acto, boolean, 'uno' | 'dos' | 'tres']> = [
      ['uno', mision1Cumplida, 'uno'],
      ['dos', mision2Cumplida, 'dos'],
      ['tres', mision3Cumplida, 'tres'],
    ];
    for (const [a, ok, k] of marcas) {
      if (acto === a && ok && !avanzado.current[k]) {
        avanzado.current[k] = true;
        avanzar();
      }
    }
  }, [acto, mision1Cumplida, mision2Cumplida, mision3Cumplida, avanzar]);

  // ── El muro ──
  const empezar = () => {
    muro.inyectarConsecuencia({
      tipo: 'comentario',
      publicacionId: ID_HORARIO,
      comentario: { id: ID_COMENTARIO, autor: NOCTURNO, texto: 'te veo hoy a las 6 😉', fecha: 'Hace un momento' },
    });
    decir('Jugador_Nocturno no es tu amigo: leyó tu publicación pública y ya sabe a qué hora estás en línea.');
    setActo('uno');
  };

  const aActo2 = () => {
    muro.responderComo(NOCTURNO.id, '¡juegas muy bien! ¿en qué escuela vas? pásame tu whats y jugamos juntos');
    muro.inyectarConsecuencia({
      tipo: 'comentario',
      publicacionId: ID_DIBUJO,
      comentario: { id: 'c-nocturno-dragon', autor: NOCTURNO, texto: 'qué buen dragón 🔥 te escribí por mensaje', fecha: 'Ahora' },
    });
    decir('Te llegó un mensaje nuevo.');
    setVista('muro');
    setAviso(null);
    setActo('dos');
  };
  const aActo3 = () => {
    setVista('muro');
    setAviso(null);
    setActo('tres');
  };
  const cerrar = () => {
    decir('Elegir quién te ve no es esconderte: es decidir tú, antes, qué sabe de ti cada quien.');
    setActo('cierre');
  };

  const cambiarVisibilidad = (id: string, v: Visibilidad) => {
    muro.cambiarVisibilidad(id, v);
    if (id === ID_DIBUJO && v !== 'publico') {
      decirUnaVez('dibujo', 'El dragón ya no lo ve cualquiera. ¿Qué decía de ti que fuera peligroso? Cerrar de más también es no saber elegir.');
    }
    if (id === ID_HORARIO && v !== 'publico') {
      decirUnaVez('horario', 'Desde ahora tu horario sólo lo ven tus amigos. Pero Jugador_Nocturno ya lo había leído: cambiar la audiencia no borra a quien ya lo vio.');
    }
    if (id.startsWith(ID_TORNEO) && nacidas[id] === 'publico' && v !== 'publico') {
      decirUnaVez('torneo-tarde', 'Ya no lo ven más desconocidos, pero Usuario_77 ya lo leyó. Lo que ya se vio no se des-ve: bórralo y publícalo bien.');
    }
  };

  const onAccion = (accion: AccionMuro, id: string) => {
    setAviso(null);
    if (accion === 'borrar') {
      muro.borrar(id);
      if (id === ID_DIBUJO) decirUnaVez('dibujo-borrado', 'Borraste el dragón. ¿Qué decía de ti que fuera peligroso?');
      return;
    }
    if (accion === 'me-gusta') muro.darMeGusta(id);
  };

  const onComentario = (accion: 'capturar' | 'reportar', publicacionId: string, comentarioId: string) => {
    setAviso(null);
    if (accion === 'reportar') setReporte({ publicacionId, comentarioId });
    else muro.capturar(publicacionId, comentarioId);
  };

  const elegirMotivo = (motivo: MotivoReporte) => {
    if (!reporte?.comentarioId) return;
    muro.reportarComentario(reporte.publicacionId, reporte.comentarioId, motivo);
    setReporte(null);
    setAviso(
      motivo === 'datos-personales'
        ? 'Recibimos tu reporte: alguien te pide datos personales. Lo vamos a revisar.'
        : `Revisamos tu reporte: con el motivo «${ETIQUETA_MOTIVO[motivo]}» no podemos hacer nada. Puedes volver a reportarlo.`,
    );
  };

  const bloquear = () => {
    muro.bloquear(NOCTURNO.id);
    decir(
      reportadoPorDatos
        ? 'Bloqueaste a Jugador_Nocturno: ya no puede escribirte ni ver lo que publiques.'
        : 'Bloqueaste a Jugador_Nocturno. Su comentario ya no se ve; si todavía no lo reportaste, desbloquéalo un momento desde su perfil.',
    );
  };

  const enviarMensaje = () => {
    if (!abierta) return;
    const para = abierta;
    if (muro.enviarMensaje(para, borrador, adjuntos) !== 'ok') return;
    setBorrador('');
    setAdjuntos([]);
    if (para === NOCTURNO.id) {
      muro.responderComo(NOCTURNO.id, '¿y vives cerca de la escuela? 👀 te puedo ver a la salida');
      decirUnaVez('nocturno', 'Le contestaste y ya pide más. Alguien que de verdad quiere jugar contigo no necesita tu escuela ni dónde vives.');
    } else if (esAdulto(para)) {
      muro.responderComo(para, 'Hiciste muy bien en contarme. Nunca le des datos a alguien que no conoces en persona. Vamos a verlo juntos.');
    } else {
      muro.responderComo(para, 'Uy, a mí también me escribió alguien así. ¿Ya le dijiste a un adulto?');
    }
  };

  const publicar = () => {
    if (palabras(publicacion) < 3) return;
    intentosTorneo.current += 1;
    const id = `${ID_TORNEO}-${intentosTorneo.current}`;
    if (muro.publicar({ id, texto: publicacion, visibilidad: audiencia, acciones: ['me-gusta', 'borrar'] }) !== 'publicada') return;
    setNacidas((prev) => ({ ...prev, [id]: audiencia }));
    setPublicacion('');
    if (audiencia === 'publico') {
      muro.inyectarConsecuencia({
        tipo: 'comentario',
        publicacionId: id,
        comentario: { autor: DESCONOCIDO, texto: '¿en qué parque? 👀', fecha: 'Ahora' },
      });
      decir('Publicaste en «🌐 Público» y en segundos comentó alguien que no conoces.');
    } else if (audiencia === 'solo-yo') {
      decir('Publicaste en «🔒 Sólo yo»: tus amigos no lo van a ver, así que no se enteran del torneo.');
    } else {
      decir('Publicaste en «👥 Sólo amigos»: la elegiste antes, así que nadie más llegó a verlo.');
    }
  };

  // ── Lo que se pinta ──
  const publicaciones = useMemo(() => muro.visibles(), [muro]);
  const reporteEnCurso: ReporteEnCurso | null = reporte ? { ...reporte, onMotivo: elegirMotivo, onCancelar: () => setReporte(null) } : null;
  const perfil = perfilDe ? muro.perfilDe(perfilDe) : undefined;
  const nuevos = muro.mensajes.filter((m) => !m.delAlumno && m.conversacion !== abierta).length;
  const enMuro = acto !== 'inicio';
  const misionTexto = acto === 'uno' ? MISION_1 : acto === 'dos' ? MISION_2 : MISION_3;
  const cumplida = acto === 'uno' ? mision1Cumplida : acto === 'dos' ? mision2Cumplida : mision3Cumplida;

  if (lab.terminado) {
    return (
      <VentanaBase marca="Tecnia Muro" subtitulo="Privacidad en redes y juegos">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">🔐</p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Elige quién te ve</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Cerraste lo que decía cuándo juegas y a qué escuela vas sin esconder tu dragón, no le diste datos a un desconocido amable, y
            elegiste la audiencia antes de publicar.
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

  const pestana = (id: Vista, etiqueta: string, testid: string) => (
    <button
      type="button"
      data-testid={testid}
      aria-pressed={vista === id}
      onClick={() => {
        setVista(id);
        setPerfilDe(null);
      }}
      className={`px-4 py-2 rounded-full font-bold border-2 ${vista === id ? 'border-violet-400 text-white' : 'border-violet-900 text-violet-200'}`}
    >
      {etiqueta}
    </button>
  );

  return (
    <VentanaBase marca="Tecnia Muro" subtitulo="Privacidad en redes y juegos">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 min-w-0">
          {enMuro && (
            <nav className="flex flex-wrap gap-2" aria-label="Secciones de Tecnia Muro">
              {pestana('muro', '🏠 Inicio', 'muro-pestana-inicio')}
              {pestana('desconocido', '👁 Así te ve un desconocido', 'muro-pestana-desconocido')}
              {pestana('mensajes', `✉️ Mensajes${nuevos > 0 ? ` (${nuevos})` : ''}`, 'muro-pestana-mensajes')}
            </nav>
          )}

          {aviso && (
            <p className="rounded-xl border-2 border-violet-500/60 bg-violet-950/70 px-4 py-2 text-sm font-semibold text-violet-100" data-testid="muro-aviso" role="status">
              {aviso}
            </p>
          )}

          {vista === 'mensajes' ? (
            <BandejaMuro
              contactos={muro.contactos}
              mensajes={muro.mensajes}
              evidencias={muro.evidencias}
              bloqueados={muro.bloqueados}
              abierta={abierta}
              onAbrir={(id) => {
                setAbierta(id);
                setAdjuntos([]);
              }}
              borrador={borrador}
              onCambiar={setBorrador}
              adjuntos={adjuntos}
              onAlternarAdjunto={(id) => setAdjuntos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
              onEnviar={enviarMensaje}
            />
          ) : vista === 'desconocido' ? (
            <VentanaMuro vista="perfil" perfil={perfilPublico} vacio="Un desconocido no ve ninguna publicación tuya." />
          ) : vista === 'perfil' && perfil ? (
            <VentanaMuro
              vista="perfil"
              perfil={perfil}
              bloqueo={
                perfil.autor.id === NOCTURNO.id
                  ? { bloqueado: nocturnoBloqueado, onBloquear: bloquear, onDesbloquear: () => muro.desbloquear(NOCTURNO.id) }
                  : null
              }
              vacio="No ves ninguna publicación de esta cuenta."
              encabezado={
                <button type="button" className="self-start text-violet-200 font-bold" onClick={() => setVista('muro')} data-testid="muro-volver">
                  ← Volver al muro
                </button>
              }
            />
          ) : (
            <VentanaMuro
              publicaciones={publicaciones}
              onAccion={enMuro ? onAccion : undefined}
              onVisibilidad={enMuro ? cambiarVisibilidad : undefined}
              onComentario={enMuro ? onComentario : undefined}
              motivos={MOTIVOS}
              reporte={reporteEnCurso}
              evidencias={muro.evidencias}
              onAbrirPerfil={
                enMuro
                  ? (autor) => {
                      if (autor.esAlumno) return;
                      setPerfilDe(autor);
                      setVista('perfil');
                    }
                  : undefined
              }
              compositor={
                acto === 'tres'
                  ? {
                      valor: publicacion,
                      onCambiar: setPublicacion,
                      onPublicar: publicar,
                      marcador: 'Escribe tu invitación al torneo…',
                      visibilidad: { valor: audiencia, onCambiar: setAudiencia },
                    }
                  : undefined
              }
            />
          )}
        </div>

        <aside className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit" data-testid="bit-panel">
          {(acto === 'uno' || acto === 'dos' || acto === 'tres') && (
            <div className="rounded-xl bg-cyan-500/10 border border-cyan-400/40 p-3" data-testid="priv-mision" data-cumplida={cumplida ? 'si' : 'no'}>
              <p className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                {acto === 'uno' ? 'Misión 1 · Tu perfil habla de más' : acto === 'dos' ? 'Misión 2 · El desconocido amable' : 'Misión 3 · Elige antes de publicar'}
              </p>
              <p className="text-sm text-white font-semibold mt-1">{misionTexto}</p>
              {cumplida ? (
                <p className="text-sm text-cyan-100 mt-2" data-testid="priv-cumplida">
                  ✔ Misión cumplida.
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-2">Todo se hace en Tecnia Muro: en tus publicaciones, en el perfil de cada persona y en Mensajes.</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2" data-testid="priv-historial">
            {historial.map((linea, i) => (
              <p key={i} className="text-sm text-slate-200 leading-relaxed">
                {linea}
              </p>
            ))}
          </div>

          {acto === 'inicio' && (
            <button type="button" onClick={empezar} data-testid="priv-seguir" className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Seguir
            </button>
          )}
          {cumplida && (acto === 'uno' || acto === 'dos' || acto === 'tres') && (
            <button
              type="button"
              onClick={acto === 'uno' ? aActo2 : acto === 'dos' ? aActo3 : cerrar}
              data-testid="priv-seguir"
              className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold"
            >
              Seguir
            </button>
          )}
          {acto === 'cierre' && (
            <button type="button" onClick={() => lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000))} data-testid="priv-terminar" className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold">
              Terminar
            </button>
          )}
        </aside>
      </div>
    </VentanaBase>
  );
}

export default LabPrivacidadEnJuegos;
