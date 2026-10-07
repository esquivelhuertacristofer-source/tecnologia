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
 * N7·«Ciudadanía digital crítica» · «Privacidad en redes» — reescrita el
 * 6-oct-2026 (DOCUMENTO-MAESTRO §69.15). 1.º de secundaria, 12–13 años.
 *
 * Antes: el panel lateral traía un bloque por publicación con su nombre y dos
 * botones, uno la respuesta; el panel decidía qué mirar. Ahora todo pasa en
 * Tecnia Muro, con el patrón de `n6-privacidad-en-juegos` (§69.2) un nivel
 * más arriba: el alumno audita lo que YA publicó hace semanas. Tres misiones,
 * cada una dice el resultado y se cumple leyendo el muro:
 *
 *   1. que un desconocido no sepa tu escuela ni por dónde vives y a qué hora
 *      vas solo, sin esconder lo que no delata nada;
 *   2. que tu perfil no conteste preguntas de seguridad (el reto viral);
 *   3. alguien YA lo había visto: guardar la prueba, contárselo a un adulto
 *      con ella y bloquear.
 *
 * Nada resta puntos (clases de ciudadanía): el costo es la consecuencia.
 */

const ALUMNO: AutorMuro = { id: 'yo', nombre: 'Dana', usuario: '@dana.rk', avatar: '🧑', esAlumno: true };
const NUEVA21: AutorMuro = { id: 'nueva21', nombre: 'Cuenta_Nueva21', avatar: '👤' };
const RETOS: AutorMuro = { id: 'retos', nombre: 'RetosVirales_MX', avatar: '🤘' };
const MARIANA: AutorMuro = { id: 'mariana', nombre: 'Mariana', avatar: '👧' };
const TOMAS: AutorMuro = { id: 'tomas', nombre: 'Tomás', avatar: '🧒' };

export const CONTACTOS: ContactoMuro[] = [
  { id: 'mama', nombre: 'Mamá', avatar: '👩', relacion: 'adulto' },
  { id: 'iker', nombre: 'Iker', avatar: '🛹', relacion: 'amigo' },
  { id: 'maestra', nombre: 'Maestra Lupita', avatar: '👩‍🏫', relacion: 'adulto' },
  { id: 'nueva21', nombre: 'Cuenta_Nueva21', avatar: '👤', relacion: 'otro' },
];

export const ID_ESCUELA = 'post-escuela';
export const ID_MASCOTA = 'post-mascota';
export const ID_CALLE = 'post-calle';
export const ID_LOGRO = 'post-logro';
export const ID_CINE = 'post-cine';
export const ID_RETO = 'reto-rockstar';
export const ID_COMENTARIO_NUEVA21 = 'c-nueva21';

const PROPIA = { autor: ALUMNO, comentarios: [], compartidos: 0, acciones: ['me-gusta', 'borrar'] as AccionMuro[], copiasSobrevivientes: [] };

const PUBLICACIONES: PublicacionMuro[] = [
  {
    ...PROPIA,
    id: ID_ESCUELA,
    texto: 'Primer día en la Secundaria Benito Juárez, turno matutino 🎒',
    fecha: 'Hace 4 meses',
    visibilidad: 'publico',
    meGusta: 12,
    pistas: ['Estudia en la Secundaria Benito Juárez, turno matutino'],
  },
  {
    ...PROPIA,
    id: ID_CINE,
    texto: 'Fui al cine con mis primos y lloré tantito con la película 🥲🍿',
    fecha: 'Hace 3 meses',
    visibilidad: 'publico',
    meGusta: 9,
  },
  {
    ...PROPIA,
    id: ID_MASCOTA,
    texto: 'Feliz cumpleaños a mi perro Rocko, mi mejor amigo desde que tengo memoria 🐶🎂',
    fecha: 'Hace 2 meses',
    visibilidad: 'publico',
    meGusta: 20,
    pistas: ['El nombre de su mascota es Rocko'],
  },
  {
    ...PROPIA,
    id: ID_CALLE,
    texto: 'Ya casi llego, vivo a dos cuadras del parque Los Naranjos y siempre regreso sola a las 3 🏃',
    fecha: 'Hace 6 semanas',
    visibilidad: 'publico',
    meGusta: 4,
    pistas: ['Vive cerca del parque Los Naranjos y llega sola a casa a las 3'],
  },
  {
    ...PROPIA,
    id: ID_LOGRO,
    texto: 'Gané el concurso de matemáticas de la zona escolar 🏆',
    fecha: 'Hace 3 semanas',
    visibilidad: 'publico',
    meGusta: 31,
  },
];

const MOTIVOS: MotivoReporte[] = ['no-me-gusta', 'spam', 'acoso', 'datos-personales'];

export const MISION_1 =
  'Que un desconocido no pueda saber a qué escuela vas ni por dónde vives y a qué hora vas sola, sin esconder lo que no delata nada.';
export const MISION_2 =
  'Ese reto pide justo las respuestas de las preguntas de seguridad de muchas cuentas. Que tu perfil no las conteste, ni por lo que ya publicaste ni por lo que comentes, y que el reto deje de juntar las de tus compañeros.';
export const MISION_3 =
  'Cuenta_Nueva21 leyó tu publicación de la calle antes de que la cerraras, y eso ya no se deshace. Haz lo que sí sirve ahora.';

type Acto = 'inicio' | 'uno' | 'dos' | 'tres' | 'cierre';
type Vista = 'muro' | 'desconocido' | 'perfil' | 'mensajes' | 'bloqueados';

const esAdulto = (id: string) => CONTACTOS.find((c) => c.id === id)?.relacion === 'adulto';
const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Lo que contesta una pregunta de seguridad de Dana: el nombre de su perro o su calle. */
export const DELATA_RESPUESTA = (t: string) => /rocko|naranjos/.test(sinAcentos(t));

export function LabPrivacidadEnRedes(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, 3);
  const muro = useMuro({ alumno: ALUMNO, publicaciones: PUBLICACIONES, contactos: CONTACTOS });

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
    'Éste es tu perfil, Dana. Cinco publicaciones de los últimos meses, todas en «🌐 Público»: las puede leer cualquiera, no sólo tus amigos.',
  ]);
  const dichos = useRef(new Set<string>());
  const decir = (l: string) => setHistorial((prev) => [...prev, l]);
  const decirUnaVez = (k: string, l: string) => {
    if (dichos.current.has(k)) return;
    dichos.current.add(k);
    decir(l);
  };

  // ── Lo que dice el estado del muro ──
  const perfilPublico = muro.perfilDe(ALUMNO, { visibilidad: ['publico'] });
  const sigue = (id: string) => {
    const p = muro.publicaciones.find((x) => x.id === id);
    return Boolean(p && !p.borrada && p.visibilidad === 'publico');
  };
  const pista = (texto: string) => perfilPublico.pistas.some((p) => p.includes(texto));
  const nueva21Bloqueada = muro.bloqueados.includes(NUEVA21.id);

  const mision1 = {
    sinEscuela: !pista('Benito Juárez'),
    sinCalle: !pista('Los Naranjos'),
    quedaLoBueno: sigue(ID_LOGRO) && sigue(ID_CINE),
  };
  const mision1Cumplida = mision1.sinEscuela && mision1.sinCalle && mision1.quedaLoBueno;

  const reto = muro.publicaciones.find((p) => p.id === ID_RETO);
  const respuestaEnElReto = Boolean(
    reto && !reto.borrada && reto.comentarios.some((c) => c.autor.id === ALUMNO.id && DELATA_RESPUESTA(c.texto)),
  );
  // El reto retirado se lleva sus comentarios; sin retirarlo, la misión no se
  // cumple aunque Rocko ya esté cerrado (si no, llegaría resuelta desde la 1).
  const mision2 = { perfilCallado: !pista('Rocko'), retoRetirado: Boolean(reto?.borrada) };
  const mision2Cumplida = Boolean(reto) && mision2.perfilCallado && mision2.retoRetirado && !respuestaEnElReto;

  const evidencia = muro.evidencias.find((e) => e.comentarioId === ID_COMENTARIO_NUEVA21);
  const mision3 = {
    captura: Boolean(evidencia),
    adulto: Boolean(
      evidencia && muro.mensajes.some((m) => m.delAlumno && esAdulto(m.conversacion) && m.adjuntos.includes(evidencia.id)),
    ),
    bloqueo: nueva21Bloqueada,
  };
  const mision3Cumplida = mision3.captura && mision3.adulto && mision3.bloqueo;

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

  // ── Los actos ──
  const empezar = () => {
    decir('Mira tu perfil como lo vería alguien que no te conoce: la pestaña «👁 Así te ve un desconocido» junta las pistas que sueltas.');
    setActo('uno');
  };

  const aActo2 = () => {
    muro.publicar({
      id: ID_RETO,
      autor: RETOS,
      texto: '🤘 ¿Cuál es tu nombre de estrella de rock? Tu PRIMERA MASCOTA + la CALLE donde vives. ¡Comenta el tuyo y etiqueta a tus amigos!',
      fecha: 'Hace un momento',
      visibilidad: 'publico',
      acciones: ['me-gusta', 'comentar', 'reportar'],
    });
    muro.inyectarConsecuencia({
      tipo: 'comentario',
      publicacionId: ID_RETO,
      comentario: { autor: MARIANA, texto: 'Pelusa Fresnos jajaja 🎸', fecha: 'Ahora' },
    });
    muro.inyectarConsecuencia({
      tipo: 'comentario',
      publicacionId: ID_RETO,
      comentario: { autor: TOMAS, texto: 'Firulais Morelos 🤘 @dana.rk te toca', fecha: 'Ahora' },
    });
    decir('Tomás te etiquetó en un reto. Ya lo contestaron varios de tu salón.');
    setVista('muro');
    setAviso(null);
    setActo('dos');
  };

  const aActo3 = () => {
    muro.inyectarConsecuencia({
      tipo: 'copia',
      publicacionId: ID_CALLE,
      copia: { texto: 'Cuenta_Nueva21 la había leído hace semanas, cuando todavía era pública.' },
    });
    muro.inyectarConsecuencia({
      tipo: 'comentario',
      publicacionId: ID_LOGRO,
      comentario: {
        id: ID_COMENTARIO_NUEVA21,
        autor: NUEVA21,
        texto: 'felicidades 🏆 ¿sigues regresando sola a las 3 por el parque? 😏',
        fecha: 'Ahora',
      },
    });
    decir('Llegó un comentario nuevo en tu publicación del concurso.');
    setVista('muro');
    setAviso(null);
    setActo('tres');
  };

  const cerrar = () => {
    decir('Auditar tarde sirvió: desde hoy nadie más lee lo que ya cerraste. Lo que ya se vio no se des-ve, pero con una prueba y un adulto deja de ser un secreto tuyo.');
    setActo('cierre');
  };

  // ── El muro ──
  const cambiarVisibilidad = (id: string, v: Visibilidad) => {
    muro.cambiarVisibilidad(id, v);
    if ((id === ID_LOGRO || id === ID_CINE) && v !== 'publico') {
      decirUnaVez(`de-mas-${id}`, '¿Qué decía esa publicación que ayudara a encontrarte? Cerrar de más también es no saber elegir.');
    }
    if (id === ID_CALLE && v !== 'publico') {
      decirUnaVez('calle', 'Desde ahora esa publicación sólo la ven tus amigos. Pero estuvo seis semanas en público: cambiar la audiencia no borra a quien ya la leyó.');
    }
  };

  const onAccion = (accion: AccionMuro, id: string) => {
    setAviso(null);
    if (accion === 'borrar') {
      muro.borrar(id);
      if (id === ID_LOGRO || id === ID_CINE) decirUnaVez(`borrada-${id}`, 'La borraste. ¿Qué decía de ti que fuera peligroso?');
      if (id === ID_CALLE) decirUnaVez('calle', 'Ya no está en tu perfil. Pero estuvo seis semanas en público: borrar no borra a quien ya la leyó.');
      return;
    }
    if (accion === 'me-gusta') muro.darMeGusta(id);
    if (accion === 'comentar') setComentando({ publicacionId: id, valor: '' });
    if (accion === 'reportar') setReporte({ publicacionId: id });
  };

  const enviarComentario = () => {
    if (!comentando) return;
    const texto = comentando.valor;
    if (muro.comentar(comentando.publicacionId, texto) !== 'ok') return;
    const enElReto = comentando.publicacionId === ID_RETO;
    setComentando(null);
    if (enElReto && DELATA_RESPUESTA(texto)) {
      muro.inyectarConsecuencia({
        tipo: 'comentario',
        publicacionId: ID_RETO,
        comentario: { autor: NUEVA21, texto: 'jaja qué buen nombre 😏 guardado', fecha: 'Ahora' },
      });
      decirUnaVez(
        'reto-dato',
        '«¿Cómo se llamaba tu primera mascota?» es una pregunta de seguridad de muchas cuentas. Ese comentario ya no lo puedes borrar; el reto sí se puede reportar.',
      );
    }
  };

  const onComentario = (accion: 'capturar' | 'reportar', publicacionId: string, comentarioId: string) => {
    setAviso(null);
    if (accion === 'reportar') setReporte({ publicacionId, comentarioId });
    else muro.capturar(publicacionId, comentarioId);
  };

  const elegirMotivo = (motivo: MotivoReporte) => {
    if (!reporte) return;
    const { publicacionId, comentarioId } = reporte;
    setReporte(null);
    if (comentarioId) {
      muro.reportarComentario(publicacionId, comentarioId, motivo);
      setAviso(
        motivo === 'datos-personales' || motivo === 'acoso'
          ? 'Recibimos tu reporte. Lo vamos a revisar.'
          : `Revisamos tu reporte: con el motivo «${ETIQUETA_MOTIVO[motivo]}» no podemos hacer nada. Puedes volver a reportarlo.`,
      );
      return;
    }
    muro.reportar(publicacionId, motivo);
    if (publicacionId === ID_RETO && motivo === 'datos-personales') {
      muro.borrar(ID_RETO);
      setAviso('Retiramos la publicación: pedía datos personales. Se fue con todos sus comentarios.');
    } else {
      setAviso(`Revisamos tu reporte: con el motivo «${ETIQUETA_MOTIVO[motivo]}» no podemos hacer nada. Puedes volver a reportarlo.`);
    }
  };

  const bloquear = () => {
    muro.bloquear(NUEVA21.id);
    decir(
      evidencia
        ? 'Bloqueaste a Cuenta_Nueva21: ya no puede escribirte ni ver lo que publiques.'
        : 'Bloqueaste a Cuenta_Nueva21 y su comentario ya no se ve: tampoco lo puedes capturar. Si te hace falta la prueba, desbloquéala un momento en «🚫 Bloqueados».',
    );
  };

  const enviarMensaje = () => {
    if (!abierta) return;
    const para = abierta;
    const conCaptura = adjuntos.length > 0;
    if (muro.enviarMensaje(para, borrador, adjuntos) !== 'ok') return;
    setBorrador('');
    setAdjuntos([]);
    if (para === NUEVA21.id) {
      muro.responderComo(NUEVA21.id, '😏 entonces sí eres tú. ¿hoy también vas sola?');
      decirUnaVez('nueva21', 'Le contestaste y ya pide más. Contestarle no lo aleja: le confirma que acertó.');
    } else if (esAdulto(para)) {
      muro.responderComo(
        para,
        conCaptura
          ? 'Gracias por enseñármelo con la captura. Hiciste muy bien. Hoy paso por ti y lo vemos juntas.'
          : 'Gracias por contarme. ¿Me puedes mandar una captura de lo que te escribió? Así lo podemos reportar bien.',
      );
    } else {
      muro.responderComo(para, 'Qué miedo 😳 ¿ya le dijiste a un adulto?');
    }
  };

  // ── Lo que se pinta ──
  // Las propias borradas se quedan como tarjeta fantasma (con lo que sobrevivió);
  // las ajenas retiradas, no.
  const publicaciones = useMemo(
    () => muro.visibles({ incluirBorradas: true }).filter((p) => !p.borrada || p.autor.esAlumno),
    [muro],
  );
  const reporteEnCurso: ReporteEnCurso | null = reporte ? { ...reporte, onMotivo: elegirMotivo, onCancelar: () => setReporte(null) } : null;
  const perfil = perfilDe ? muro.perfilDe(perfilDe) : undefined;
  const nuevos = muro.mensajes.filter((m) => !m.delAlumno && m.conversacion !== abierta).length;
  const enMuro = acto !== 'inicio';
  const misionTexto = acto === 'uno' ? MISION_1 : acto === 'dos' ? MISION_2 : MISION_3;
  const cumplida = acto === 'uno' ? mision1Cumplida : acto === 'dos' ? mision2Cumplida : mision3Cumplida;

  const terminar = () => {
    lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000));
  };

  if (lab.terminado) {
    return (
      <VentanaBase marca="Tecnia Muro" subtitulo="Privacidad en redes">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">🕶️</p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Sabe auditar su perfil</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Cerraste lo que decía dónde estudias y por dónde andas sin esconder lo que no hacía falta, no le diste a un reto la
            respuesta de tus preguntas de seguridad, y cuando alguien ya lo había visto guardaste la prueba y se lo contaste a un
            adulto.
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
    <VentanaBase marca="Tecnia Muro" subtitulo="Privacidad en redes">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 min-w-0">
          {enMuro && (
            <nav className="flex flex-wrap gap-2" aria-label="Secciones de Tecnia Muro">
              {pestana('muro', '🏠 Inicio', 'muro-pestana-inicio')}
              {pestana('desconocido', '👁 Así te ve un desconocido', 'muro-pestana-desconocido')}
              {pestana('mensajes', `✉️ Mensajes${nuevos > 0 ? ` (${nuevos})` : ''}`, 'muro-pestana-mensajes')}
              {muro.bloqueados.length > 0 && pestana('bloqueados', '🚫 Bloqueados', 'muro-pestana-bloqueados')}
            </nav>
          )}

          {aviso && (
            <p className="rounded-xl border-2 border-violet-500/60 bg-violet-950/70 px-4 py-2 text-sm font-semibold text-violet-100" data-testid="muro-aviso" role="status">
              {aviso}
            </p>
          )}

          {vista === 'bloqueados' ? (
            <section className="rounded-2xl border-2 border-violet-800 bg-[#140b26] p-4 flex flex-col gap-3" data-testid="muro-bloqueados">
              <h3 className="text-white font-extrabold">Cuentas bloqueadas</h3>
              {muro.bloqueados.length === 0 ? (
                <p className="text-violet-200 text-sm">No tienes cuentas bloqueadas.</p>
              ) : (
                muro.bloqueados.map((id) => {
                  const c = CONTACTOS.find((x) => x.id === id);
                  return (
                    <div key={id} className="flex items-center justify-between gap-3 rounded-xl bg-violet-950/60 px-3 py-2">
                      <span className="text-white font-semibold">
                        {c?.avatar} {c?.nombre ?? id}
                      </span>
                      <button
                        type="button"
                        data-testid={`muro-desbloquear-${id}`}
                        onClick={() => muro.desbloquear(id)}
                        className="px-3 py-1.5 rounded-full border-2 border-violet-400 text-violet-100 font-bold text-sm"
                      >
                        Desbloquear
                      </button>
                    </div>
                  );
                })
              )}
            </section>
          ) : vista === 'mensajes' ? (
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
                perfil.autor.id === NUEVA21.id
                  ? { bloqueado: nueva21Bloqueada, onBloquear: bloquear, onDesbloquear: () => muro.desbloquear(NUEVA21.id) }
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
              comentando={
                comentando
                  ? {
                      publicacionId: comentando.publicacionId,
                      valor: comentando.valor,
                      onCambiar: (v) => setComentando({ ...comentando, valor: v }),
                      onEnviar: enviarComentario,
                      marcador: 'Escribe un comentario…',
                    }
                  : null
              }
              onAbrirPerfil={
                enMuro
                  ? (autor) => {
                      if (autor.esAlumno) return;
                      setPerfilDe(autor);
                      setVista('perfil');
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
                {acto === 'uno' ? 'Misión 1 · Tu perfil habla de más' : acto === 'dos' ? 'Misión 2 · La pregunta de seguridad' : 'Misión 3 · Alguien ya lo había visto'}
              </p>
              <p className="text-sm text-white font-semibold mt-1">{misionTexto}</p>
              {cumplida ? (
                <p className="text-sm text-cyan-100 mt-2" data-testid="priv-cumplida">
                  ✔ Misión cumplida.
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-2">Todo se hace en Tecnia Muro: en tus publicaciones, en el perfil de cada cuenta y en Mensajes.</p>
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
              Empezar la auditoría
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
            <button type="button" onClick={terminar} data-testid="priv-terminar" className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold">
              Terminar
            </button>
          )}
        </aside>
      </div>
    </VentanaBase>
  );
}

export default LabPrivacidadEnRedes;
