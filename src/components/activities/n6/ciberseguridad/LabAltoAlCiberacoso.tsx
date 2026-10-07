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
} from '../../../simuladores/muro';

/**
 * N6 · «Ciberseguridad» · «Alto al ciberacoso» — reescrita el 6-oct-2026
 * (DOCUMENTO-MAESTRO §69.1).
 *
 * Antes: tres botones al lado del muro, con «Reporto el comentario» como el
 * único en esmeralda, y bloquear como un booleano local. Ahora la clase pasa
 * DENTRO de Tecnia Muro: el alumno captura, reporta con un motivo, bloquea
 * desde el perfil y le escribe a un adulto por Mensajes. Cada misión dice el
 * resultado («que deje de molestarte y que un adulto pueda ayudarte, con
 * pruebas»), nunca los pasos, y se cumple leyendo el estado del muro.
 *
 * El orden es parte de la lección y lo enseña el propio muro: si bloqueas
 * antes de guardar la captura, el comentario deja de verse y ya no hay prueba
 * (`useMuro.capturar` rechaza lo oculto).
 *
 * «No es tu culpa» se dice cinco veces con esas letras exactas en el camino
 * bueno (criterio de `n4-si-algo-me-incomoda`), y el historial sólo crece.
 * Equivocarse NO resta puntos (decisión de la clase original, que se
 * respeta): cuesta dentro del muro —el comentario que desaparece, el reporte
 * que rechazan, Uriel que responde peor— y la misión sigue abierta.
 */

const ALUMNA: AutorMuro = { id: 'yo', nombre: 'Sofi', usuario: '@sofi_dibuja', avatar: '🎨', esAlumno: true };
const URIEL: AutorMuro = { id: 'uriel', nombre: 'Uriel', avatar: '😏' };
const MATEO: AutorMuro = { id: 'mateo', nombre: 'Mateo', avatar: '🧢' };
const RODRI: AutorMuro = { id: 'rodri', nombre: 'Rodri', avatar: '🎮' };
const CARO: AutorMuro = { id: 'caro', nombre: 'Caro', avatar: '🌸' };

export const CONTACTOS: ContactoMuro[] = [
  { id: 'mama', nombre: 'Mamá', avatar: '👩', relacion: 'adulto' },
  { id: 'valentina', nombre: 'Valentina', avatar: '💛', relacion: 'amigo' },
  { id: 'profe', nombre: 'Profe Lupita', avatar: '👩‍🏫', relacion: 'adulto' },
  { id: 'lia', nombre: 'Lía', avatar: '🦋', relacion: 'amigo' },
  { id: 'uriel', nombre: 'Uriel', avatar: '😏', relacion: 'otro' },
];

const ID_DIBUJO = 'dibujo-gato';
const ID_COMENTARIO = 'c-uriel';
const ID_MEME = 'meme-lia';

const POST_DIBUJO: PublicacionMuro = {
  id: ID_DIBUJO,
  autor: ALUMNA,
  texto: 'Terminé mi dibujo de un gato astronauta 🐱🚀 ¡me tardé toda la semana!',
  imagen: { emoji: '🐱', descripcion: 'Un gato con casco de astronauta flotando entre planetas, dibujado con colores' },
  fecha: 'Hoy',
  visibilidad: 'publico',
  meGusta: 5,
  comentarios: [],
  compartidos: 0,
  acciones: ['me-gusta', 'comentar'],
  copiasSobrevivientes: [],
};

const POST_MEME: PublicacionMuro = {
  id: ID_MEME,
  autor: MATEO,
  texto: '😂 miren a Lía en la foto del salón',
  imagen: { emoji: '📸', descripcion: 'Una foto de Lía tomada sin que se diera cuenta, con la boca abierta a media frase' },
  fecha: 'Hace 10 minutos',
  visibilidad: 'publico',
  meGusta: 23,
  comentarios: [
    { id: 'c-rodri', autor: RODRI, texto: 'jajajaja 💀', fecha: 'Hace 8 minutos' },
    { id: 'c-caro', autor: CARO, texto: '😂😂😂', fecha: 'Hace 5 minutos' },
  ],
  compartidos: 4,
  acciones: ['me-gusta', 'comentar', 'compartir', 'reportar'],
  copiasSobrevivientes: [],
};

type Acto = 'inicio' | 'uno' | 'dos' | 'cierre';
type Vista = 'muro' | 'perfil' | 'mensajes';
type Tropiezo = 'contestar' | 'bloqueo-sin-prueba' | 'motivo' | 'me-gusta' | 'compartir';

export const MISION_1 =
  'Uriel te dejó un comentario cruel en tu dibujo. Haz que deje de molestarte y que un adulto de confianza pueda ayudarte, con pruebas.';
export const MISION_2 = 'Mateo publicó una foto de Lía para burlarse de ella. Haz lo que haría un buen amigo de Lía.';

const NO_ES_TU_CULPA = 'No es tu culpa';

const esAdulto = (id: string) => CONTACTOS.find((c) => c.id === id)?.relacion === 'adulto';
const palabras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export function LabAltoAlCiberacoso(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, 2);
  const muro = useMuro({ alumno: ALUMNA, publicaciones: [POST_DIBUJO, POST_MEME], contactos: CONTACTOS });

  const [acto, setActo] = useState<Acto>('inicio');
  const [vista, setVista] = useState<Vista>('muro');
  const [perfilDe, setPerfilDe] = useState<AutorMuro | null>(null);
  const [reporte, setReporte] = useState<{ publicacionId: string; comentarioId?: string } | null>(null);
  const [comentando, setComentando] = useState<{ publicacionId: string; valor: string } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [borrador, setBorrador] = useState('');
  const [adjuntos, setAdjuntos] = useState<string[]>([]);
  const [historial, setHistorial] = useState<string[]>([
    'Publicaste tu dibujo. La mayoría de la gente que lo va a ver es buena onda.',
  ]);

  const tropiezos = useRef(new Set<Tropiezo>());
  const dichos = useRef(new Set<string>());
  const decir = (linea: string) => setHistorial((prev) => [...prev, linea]);
  /** Una línea con clave se dice una sola vez (las cinco «No es tu culpa» incluidas). */
  const decirUnaVez = (clave: string, linea: string) => {
    if (dichos.current.has(clave)) return;
    dichos.current.add(clave);
    decir(linea);
  };
  /*
   * Los tropiezos se cuentan (para el docente) pero NO restan: igual que en
   * `n4-si-algo-me-incomoda`, a quien sufre acoso no se le quitan puntos por
   * reaccionar mal. Lo que cuesta es la consecuencia dentro del muro.
   */
  const tropezar = (t: Tropiezo) => {
    tropiezos.current.add(t);
  };

  // ── Lo que dice el estado del muro ──
  const dibujo = muro.publicaciones.find((p) => p.id === ID_DIBUJO);
  const meme = muro.publicaciones.find((p) => p.id === ID_MEME);
  const comentarioUriel = dibujo?.comentarios.find((c) => c.id === ID_COMENTARIO);
  const capturaUriel = muro.evidencias.find((e) => e.comentarioId === ID_COMENTARIO);
  const urielBloqueado = muro.bloqueados.includes(URIEL.id);

  const mision1 = {
    prueba: Boolean(capturaUriel),
    reporte: comentarioUriel?.motivoReporte === 'acoso',
    bloqueo: urielBloqueado,
    adulto: muro.mensajes.some(
      (m) => m.delAlumno && esAdulto(m.conversacion) && capturaUriel !== undefined && m.adjuntos.includes(capturaUriel.id),
    ),
  };
  const mision1Cumplida = mision1.prueba && mision1.reporte && mision1.bloqueo && mision1.adulto;

  const mision2 = {
    reporte: meme?.motivoReporte === 'acoso',
    sinMeGusta: !meme?.meGustaDelAlumno,
    apoyo: muro.mensajes.some((m) => m.delAlumno && m.conversacion === 'lia' && palabras(m.texto) >= 2),
  };
  const mision2Cumplida = mision2.reporte && mision2.sinMeGusta && mision2.apoyo;

  // El avance se lee del muro, no de un botón. El efecto sólo avisa a la
  // plataforma (progreso); lo que se le dice al alumno se deriva en el render.
  const avanzado = useRef({ uno: false, dos: false });
  const { avanzar } = lab;
  useEffect(() => {
    if (acto === 'uno' && mision1Cumplida && !avanzado.current.uno) {
      avanzado.current.uno = true;
      avanzar();
    }
    if (acto === 'dos' && mision2Cumplida && !avanzado.current.dos) {
      avanzado.current.dos = true;
      avanzar();
    }
  }, [acto, mision1Cumplida, mision2Cumplida, avanzar]);

  // ── El muro ──
  const empezar = () => {
    muro.inyectarConsecuencia({
      tipo: 'comentario',
      publicacionId: ID_DIBUJO,
      comentario: { id: ID_COMENTARIO, autor: URIEL, texto: 'jajaja qué feo te quedó, ni parece gato', fecha: 'Hace un momento' },
    });
    decirUnaVez('culpa-1', `Uriel no debería haberte dicho eso. ${NO_ES_TU_CULPA}.`);
    setActo('uno');
  };

  const pasarAlActo2 = () => {
    setActo('dos');
    setVista('muro');
    setAviso(null);
    decir('Unos días después, en tu muro aparece algo que no es contigo.');
  };

  const cerrar = () => {
    decirUnaVez('culpa-5', `Uriel y Mateo se equivocaron, no tú ni Lía. ${NO_ES_TU_CULPA}, y ya sabes qué hacer.`);
    setActo('cierre');
  };

  const onAccion = (accion: AccionMuro, id: string) => {
    setAviso(null);
    if (accion === 'comentar') {
      setComentando({ publicacionId: id, valor: '' });
      return;
    }
    if (accion === 'reportar') {
      setReporte({ publicacionId: id });
      return;
    }
    if (accion === 'me-gusta') {
      const antes = muro.publicaciones.find((p) => p.id === id);
      muro.darMeGusta(id);
      if (id === ID_MEME && antes && !antes.meGustaDelAlumno) {
        tropezar('me-gusta');
        decirUnaVez('mateo-risa', 'Cada «me gusta» le dice a la red que enseñe esa foto a más gente. Lo puedes quitar.');
        muro.inyectarConsecuencia({
          tipo: 'comentario',
          publicacionId: ID_MEME,
          comentario: { autor: MATEO, texto: '¿verdad que sí da risa? 😂', fecha: 'Ahora' },
        });
      }
      return;
    }
    if (accion === 'compartir') {
      muro.compartir(id);
      if (id === ID_MEME) {
        tropezar('compartir');
        decir('Ahora también la ven tus amigos. Compartir no se deshace.');
      }
    }
  };

  const enviarComentario = () => {
    if (!comentando) return;
    const r = muro.comentar(comentando.publicacionId, comentando.valor);
    if (r !== 'ok') return;
    const enSuDibujo = comentando.publicacionId === ID_DIBUJO;
    setComentando(null);
    if (enSuDibujo && acto === 'uno' && !urielBloqueado) {
      tropezar('contestar');
      muro.inyectarConsecuencia({
        tipo: 'comentario',
        publicacionId: ID_DIBUJO,
        comentario: { autor: URIEL, texto: 'jaja ya te enojaste 😂', fecha: 'Ahora' },
      });
      decirUnaVez('contestar', 'Contestarle le dio justo lo que buscaba: que siguieras ahí. Tú no empezaste esto.');
    }
  };

  const elegirMotivo = (motivo: MotivoReporte) => {
    if (!reporte) return;
    const { publicacionId, comentarioId } = reporte;
    setReporte(null);
    if (comentarioId) muro.reportarComentario(publicacionId, comentarioId, motivo);
    else muro.reportar(publicacionId, motivo);
    if (motivo !== 'acoso') {
      tropezar('motivo');
      setAviso(`Revisamos tu reporte: con el motivo «${ETIQUETA_MOTIVO[motivo]}» no podemos hacer nada. Puedes volver a reportarlo.`);
      return;
    }
    setAviso('Recibimos tu reporte de acoso. Lo vamos a revisar.');
    if (comentarioId === ID_COMENTARIO) decirUnaVez('culpa-2', `Reportar no es exagerar. ${NO_ES_TU_CULPA}.`);
  };

  const onComentario = (accion: 'capturar' | 'reportar', publicacionId: string, comentarioId: string) => {
    setAviso(null);
    if (accion === 'reportar') {
      setReporte({ publicacionId, comentarioId });
      return;
    }
    if (muro.capturar(publicacionId, comentarioId) === 'ok' && comentarioId === ID_COMENTARIO) {
      decirUnaVez('captura', 'Guardaste la captura. Esa prueba ya es tuya, aunque el comentario desaparezca.');
    }
  };

  const bloquear = () => {
    muro.bloquear(URIEL.id);
    if (!capturaUriel) {
      tropezar('bloqueo-sin-prueba');
      decir(
        'Uriel ya no puede escribirte. Pero su comentario dejó de verse y no guardaste la prueba: un adulto no va a poder ver qué pasó. Desde su perfil lo puedes desbloquear un momento.',
      );
      return;
    }
    decirUnaVez('culpa-3', `Bloqueaste a Uriel: ya no puede comentar lo que publiques. Uriel se equivocó, no tú. ${NO_ES_TU_CULPA}.`);
  };

  const enviarMensaje = () => {
    if (!abierta) return;
    const para = abierta;
    const texto = borrador;
    const conAdjuntos = adjuntos;
    if (muro.enviarMensaje(para, texto, conAdjuntos) !== 'ok') return;
    setBorrador('');
    setAdjuntos([]);
    const llevaPrueba = capturaUriel !== undefined && conAdjuntos.includes(capturaUriel.id);
    if (esAdulto(para)) {
      if (llevaPrueba) {
        muro.responderComo(para, `Hiciste muy bien en contarme y en guardar la prueba. Mañana lo vemos con la escuela. ${NO_ES_TU_CULPA}.`);
        decirUnaVez('culpa-4', 'Un adulto ya lo sabe y tiene la prueba.');
      } else if (acto === 'uno') {
        muro.responderComo(para, 'Gracias por contarme. ¿Me enseñas qué te escribió?');
      } else {
        muro.responderComo(para, 'Gracias por avisarme. Voy a hablar con la escuela.');
      }
    } else if (para === 'valentina') {
      muro.responderComo(para, 'Qué mala onda de Uriel 💛 Tu gato está increíble. ¿Ya le contaste a un adulto?');
    } else if (para === 'lia') {
      muro.responderComo(para, 'Gracias 🥺 me sentía súper mal. Me ayuda saber que no todos se rieron.');
    }
  };

  // ── Lo que se pinta ──
  const publicaciones = useMemo(
    () => muro.visibles().filter((p) => p.id !== ID_MEME || acto === 'dos' || acto === 'cierre'),
    [muro, acto],
  );
  const reporteEnCurso: ReporteEnCurso | null = reporte
    ? { ...reporte, onMotivo: elegirMotivo, onCancelar: () => setReporte(null) }
    : null;
  const perfil = perfilDe ? muro.perfilDe(perfilDe) : undefined;
  const nuevos = muro.mensajes.filter((m) => !m.delAlumno && m.conversacion !== abierta).length;
  // Las cinco «No es tu culpa» del muro también cuentan: la de Mamá llega por Mensajes.
  const mensajeDeMama = muro.mensajes.find((m) => !m.delAlumno && m.texto.includes(NO_ES_TU_CULPA));

  if (lab.terminado) {
    return (
      <VentanaBase marca="Tecnia Muro" subtitulo="Alto al ciberacoso">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">🛑</p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Sabe defenderse sin pelear</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            No contestaste, guardaste la prueba, reportaste, bloqueaste y se lo contaste a un adulto. Y cuando le pasó a Lía, no te reíste: la
            ayudaste. Nunca fue tu culpa.
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

  const enMuro = acto !== 'inicio';

  return (
    <VentanaBase marca="Tecnia Muro" subtitulo="Alto al ciberacoso">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 min-w-0">
          {enMuro && (
            <nav className="flex gap-2" aria-label="Secciones de Tecnia Muro">
              <button
                type="button"
                data-testid="muro-pestana-inicio"
                aria-pressed={vista !== 'mensajes'}
                onClick={() => {
                  setVista('muro');
                  setPerfilDe(null);
                }}
                className={`px-4 py-2 rounded-full font-bold border-2 ${vista !== 'mensajes' ? 'border-violet-400 text-white' : 'border-violet-900 text-violet-200'}`}
              >
                🏠 Inicio
              </button>
              <button
                type="button"
                data-testid="muro-pestana-mensajes"
                aria-pressed={vista === 'mensajes'}
                onClick={() => setVista('mensajes')}
                className={`px-4 py-2 rounded-full font-bold border-2 ${vista === 'mensajes' ? 'border-violet-400 text-white' : 'border-violet-900 text-violet-200'}`}
              >
                ✉️ Mensajes{nuevos > 0 ? ` (${nuevos})` : ''}
              </button>
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
          ) : vista === 'perfil' && perfil ? (
            <VentanaMuro
              vista="perfil"
              perfil={perfil}
              bloqueo={
                perfil.autor.id === URIEL.id
                  ? { bloqueado: urielBloqueado, onBloquear: bloquear, onDesbloquear: () => muro.desbloquear(URIEL.id) }
                  : null
              }
              vacio={urielBloqueado && perfil.autor.id === URIEL.id ? 'Bloqueaste a esta persona: no ves lo que publica.' : undefined}
              encabezado={
                <button type="button" className="self-start text-violet-200 font-bold" onClick={() => setVista('muro')} data-testid="muro-volver">
                  ← Volver al muro
                </button>
              }
            />
          ) : (
            <VentanaMuro
              publicaciones={enMuro ? publicaciones : publicaciones.filter((p) => p.id === ID_DIBUJO)}
              onAccion={enMuro ? onAccion : undefined}
              onComentario={enMuro ? onComentario : undefined}
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
              comentando={
                comentando
                  ? {
                      publicacionId: comentando.publicacionId,
                      valor: comentando.valor,
                      onCambiar: (v) => setComentando({ ...comentando, valor: v }),
                      onEnviar: enviarComentario,
                    }
                  : null
              }
            />
          )}
        </div>

        <aside className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit" data-testid="bit-panel">
          {(acto === 'uno' || acto === 'dos') && (
            <div
              className="rounded-xl bg-cyan-500/10 border border-cyan-400/40 p-3"
              data-testid="acoso-mision"
              data-cumplida={(acto === 'uno' ? mision1Cumplida : mision2Cumplida) ? 'si' : 'no'}
            >
              <p className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">{acto === 'uno' ? 'Misión 1 · Te pasa a ti' : 'Misión 2 · Le pasa a Lía'}</p>
              <p className="text-sm text-white font-semibold mt-1">{acto === 'uno' ? MISION_1 : MISION_2}</p>
              {acto === 'uno' && mision1Cumplida ? (
                <p className="text-sm text-cyan-100 mt-2" data-testid="acoso-cumplida">
                  ✔ Lo hiciste completo: no le contestaste, guardaste la prueba, lo reportaste como acoso, lo bloqueaste y se lo contaste a un adulto. Eso es
                  defenderse sin pelear.
                </p>
              ) : acto === 'dos' && mision2Cumplida ? (
                <p className="text-sm text-cyan-100 mt-2" data-testid="acoso-cumplida">
                  ✔ No le diste más vida a la burla, la reportaste y Lía supo que no está sola. Eso hace un buen amigo.
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-2">
                  Todo se hace en Tecnia Muro: en las publicaciones y sus comentarios, en el perfil de cada persona y en Mensajes.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2" data-testid="acoso-historial">
            {historial.map((linea, i) => (
              <p key={i} className="text-sm text-slate-200 leading-relaxed">
                {linea}
              </p>
            ))}
            {acto === 'cierre' && mensajeDeMama && <p className="text-sm text-slate-200 leading-relaxed">Mamá: «{mensajeDeMama.texto}»</p>}
          </div>

          {acto === 'inicio' && (
            <button type="button" onClick={empezar} data-testid="acoso-seguir" className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Seguir
            </button>
          )}
          {acto === 'uno' && mision1Cumplida && (
            <button type="button" onClick={pasarAlActo2} data-testid="acoso-seguir" className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Seguir
            </button>
          )}
          {acto === 'dos' && mision2Cumplida && (
            <button type="button" onClick={cerrar} data-testid="acoso-seguir" className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Seguir
            </button>
          )}
          {acto === 'cierre' && (
            <button type="button" onClick={() => lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000))} data-testid="acoso-terminar" className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold">
              Terminar
            </button>
          )}
        </aside>
      </div>
    </VentanaBase>
  );
}

export default LabAltoAlCiberacoso;
