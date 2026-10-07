'use client';

import { useEffect, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';

/**
 * N7·«Ciudadanía digital crítica» · «Equilibrio digital» — reescrita el
 * 6-oct-2026 (DOCUMENTO-MAESTRO §69.16). 1.º de secundaria, 12–13 años.
 *
 * Antes: cuatro avisos con dos botones en el panel, la respuesta escrita en
 * el botón, y el teléfono era una imagen. Ahora «Tecnia Avisos» es un teléfono
 * que se usa: inicio, apps, banners, centro de notificaciones y Ajustes →
 * Bienestar digital con los datos de la semana. Se construye aquí porque el
 * armazón de sistema es un explorador de archivos y sólo esta clase necesita
 * un teléfono (si llega una segunda, se sube a `simuladores/`).
 *
 * Tres misiones, cada una dice el resultado y se juzga leyendo el estado:
 *   1. que el teléfono no te hubiera interrumpido más de 10 veces al día la
 *      semana pasada, sin dejar de oír a Mamá;
 *   2. la tarde del viernes: el reloj avanza con lo que haces, los avisos que
 *      suenan cuestan concentración, y hay que terminar la tarea antes de la
 *      cena y contestarle a Mamá a tiempo;
 *   3. que en las noches antes de escuela nada te despierte después de las
 *      10, la alarma siga y Mamá pueda llamarte.
 *
 * Nada resta puntos: si la tarde no sale, se repite desde las 8:10.
 */

// ── Los datos: apps, canales y la semana pasada ──

export type AppAvisos = 'mensajes' | 'juego' | 'videos';
export type CanalId = 'mama' | 'grupo' | 'kevin' | 'ofertas' | 'energia' | 'invitaciones' | 'recomendaciones' | 'suscripciones';

export const APPS: Record<AppAvisos, { nombre: string; icono: string; color: string }> = {
  mensajes: { nombre: 'Mensajes', icono: '💬', color: '#22c55e' },
  juego: { nombre: 'Reino de Cristal', icono: '🎮', color: '#f43f5e' },
  videos: { nombre: 'TecniaTube', icono: '▶️', color: '#f59e0b' },
};

export const CANALES: Array<{ id: CanalId; app: AppAvisos; nombre: string; semana: number }> = [
  { id: 'mama', app: 'mensajes', nombre: 'Mamá', semana: 12 },
  { id: 'grupo', app: 'mensajes', nombre: 'Grupo Amigos 1°B', semana: 214 },
  { id: 'kevin', app: 'mensajes', nombre: 'Kevin', semana: 38 },
  { id: 'ofertas', app: 'juego', nombre: 'Ofertas por tiempo limitado', semana: 126 },
  { id: 'energia', app: 'juego', nombre: 'Tu energía está llena', semana: 49 },
  { id: 'invitaciones', app: 'juego', nombre: 'Invitaciones de amigos', semana: 9 },
  { id: 'recomendaciones', app: 'videos', nombre: 'Recomendaciones', semana: 70 },
  { id: 'suscripciones', app: 'videos', nombre: 'Canales que sigues', semana: 6 },
];

const CANAL = Object.fromEntries(CANALES.map((c) => [c.id, c])) as Record<CanalId, (typeof CANALES)[number]>;

export interface AjustesAvisos {
  apps: Record<AppAvisos, boolean>;
  canales: Record<CanalId, boolean>;
}

export const AJUSTES_DE_FABRICA: AjustesAvisos = {
  apps: { mensajes: true, juego: true, videos: true },
  canales: { mama: true, grupo: true, kevin: true, ofertas: true, energia: true, invitaciones: true, recomendaciones: true, suscripciones: true },
};

export const suena = (canal: CanalId, a: AjustesAvisos) => a.apps[CANAL[canal].app] && a.canales[canal];
export const avisosQueSuenan = (a: AjustesAvisos) => CANALES.filter((c) => suena(c.id, a)).reduce((n, c) => n + c.semana, 0);
export const TOPE_SEMANA = 70;
export const mision1Cumple = (a: AjustesAvisos) => suena('mama', a) && avisosQueSuenan(a) <= TOPE_SEMANA;

/** Tiempo de pantalla de la semana pasada, en minutos. */
const USO_SEMANA: Array<{ app: string; icono: string; minutos: number; color: string }> = [
  { app: 'Reino de Cristal', icono: '🎮', minutos: 860, color: '#f43f5e' },
  { app: 'TecniaTube', icono: '▶️', minutos: 425, color: '#f59e0b' },
  { app: 'Mensajes', icono: '💬', minutos: 340, color: '#22c55e' },
  { app: 'Tarea', icono: '📘', minutos: 110, color: '#38bdf8' },
];
/** Promedio de minutos por hora en noches de escuela: el juego se come de 9 a 12. */
const USO_POR_HORA: Array<{ hora: string; minutos: number; juego: number }> = [
  { hora: '6 pm', minutos: 18, juego: 4 },
  { hora: '7 pm', minutos: 15, juego: 3 },
  { hora: '8 pm', minutos: 22, juego: 6 },
  { hora: '9 pm', minutos: 44, juego: 34 },
  { hora: '10 pm', minutos: 55, juego: 47 },
  { hora: '11 pm', minutos: 51, juego: 45 },
  { hora: '12 am', minutos: 26, juego: 22 },
];

// ── La tarde del viernes: el reloj que avanza con lo que haces ──

export interface AvisoProgramado {
  id: string;
  min: number; // minutos después de las 8:00 pm
  canal: CanalId;
  texto: string;
}

export const AVISOS_TARDE: AvisoProgramado[] = [
  { id: 't1', min: 12, canal: 'grupo', texto: 'Mira este meme 😂😂😂' },
  { id: 't2', min: 14, canal: 'ofertas', texto: '¡Cofre legendario gratis! Sólo por 2 minutos ⏳' },
  { id: 't3', min: 17, canal: 'grupo', texto: 'jajaja el de Tomás' },
  { id: 't4', min: 19, canal: 'recomendaciones', texto: 'Te va a encantar: 10 jugadas imposibles' },
  { id: 't5', min: 21, canal: 'energia', texto: 'Tu energía está llena ⚡ ¡A jugar!' },
  { id: 't6', min: 24, canal: 'grupo', texto: '¿alguien ya hizo la de mate?' },
  { id: 't7', min: 27, canal: 'ofertas', texto: 'Última oportunidad: cofre legendario ⏳' },
  { id: 't8', min: 30, canal: 'mama', texto: '¿Ya casi? La cena se enfría' },
  { id: 't9', min: 33, canal: 'grupo', texto: '📸 Foto' },
  { id: 't10', min: 36, canal: 'kevin', texto: 'oye, ¿viste el evento?' },
  { id: 't11', min: 40, canal: 'ofertas', texto: 'Nuevo cofre por tiempo limitado ⏳' },
];

export const EJERCICIOS: Array<{ enunciado: string; respuesta: number }> = [
  { enunciado: '¿Cuánto es el 25 % de 80?', respuesta: 20 },
  { enunciado: '¿Cuánto es 3/4 de 60?', respuesta: 45 },
  { enunciado: 'Si 4 cuadernos cuestan $92, ¿cuánto cuestan 7?', respuesta: 161 },
  { enunciado: '(−3) + 8 =', respuesta: 5 },
  { enunciado: 'Redondea 47.6 al entero más cercano.', respuesta: 48 },
];

export const INICIO_TARDE = 10; // 8:10 pm
export const CENA = 45; // 8:45 pm
export const PLAZO_MAMA = 5;
export const MIN_POR_EJERCICIO = 4;
export const MIN_POR_AVISO = 2;
/** Lo que cuesta abrir cada app a media tarde (minutos). */
export const COSTO_ABRIR: Partial<Record<string, number>> = { grupo: 5, kevin: 3, juego: 8, videos: 6 };

export interface AvisoLlegado extends AvisoProgramado {
  sono: boolean;
}

export interface Tarde {
  reloj: number;
  siguiente: number;
  llegados: AvisoLlegado[];
  resueltos: number;
  mamaLlego: number | null;
  mamaContestada: number | null;
  terminoA: number | null;
}

export const TARDE_INICIAL: Tarde = {
  reloj: INICIO_TARDE,
  siguiente: 0,
  llegados: [],
  resueltos: 0,
  mamaLlego: null,
  mamaContestada: null,
  terminoA: null,
};

/** Avanza el reloj y entrega los avisos que tocan; cada uno que suena cuesta 2 minutos, que pueden traer más. */
export function correrReloj(t: Tarde, minutos: number, a: AjustesAvisos): Tarde {
  let reloj = t.reloj + minutos;
  let siguiente = t.siguiente;
  let mamaLlego = t.mamaLlego;
  const llegados = [...t.llegados];
  while (siguiente < AVISOS_TARDE.length && AVISOS_TARDE[siguiente].min <= reloj) {
    const aviso = AVISOS_TARDE[siguiente];
    siguiente += 1;
    const sono = suena(aviso.canal, a);
    llegados.push({ ...aviso, sono });
    if (aviso.canal === 'mama') mamaLlego = aviso.min;
    if (sono) reloj += MIN_POR_AVISO;
  }
  return { ...t, reloj, siguiente, llegados, mamaLlego };
}

export type EstadoTarde = 'en-curso' | 'mama-esperando-de-mas' | 'sin-terminar-a-la-cena' | 'lista';

export function estadoDeLaTarde(t: Tarde): EstadoTarde {
  const plazo = t.mamaLlego === null ? null : t.mamaLlego + PLAZO_MAMA;
  if (plazo !== null && (t.mamaContestada === null ? t.reloj > plazo : t.mamaContestada > plazo)) return 'mama-esperando-de-mas';
  if (t.terminoA === null ? t.reloj > CENA : t.terminoA > CENA) return 'sin-terminar-a-la-cena';
  if (t.terminoA !== null && t.terminoA <= CENA && t.mamaContestada !== null) return 'lista';
  return 'en-curso';
}

export const hora = (min: number) => {
  const total = 20 * 60 + min;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')} pm`;
};

// ── Hora de dormir ──

export interface HoraDeDormir {
  activo: boolean;
  inicio: number; // minutos desde medianoche
  fin: number;
  noches: number[]; // 0 = la noche del domingo … 6 = la del sábado
  excepciones: CanalId[];
  silenciarAlarmas: boolean;
}

export const DORMIR_DE_FABRICA: HoraDeDormir = {
  activo: false,
  inicio: 23 * 60,
  fin: 7 * 60,
  noches: [1, 2, 3, 4, 5],
  excepciones: [],
  silenciarAlarmas: false,
};

export const NOCHES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const OPCIONES_INICIO = [20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5, 24].map((h) => Math.round(h * 60));
const OPCIONES_FIN = [5, 5.5, 6, 6.5, 7, 7.5, 8].map((h) => Math.round(h * 60));
export const reloj24 = (min: number) => {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  const sufijo = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${sufijo}`;
};

/** Lo que le falta a la Hora de dormir para cumplir la misión 3 (vacío = cumple). */
export function faltasDeDormir(d: HoraDeDormir): string[] {
  const f: string[] = [];
  if (!d.activo) f.push('apagada');
  if (d.inicio > 22 * 60) f.push('empieza después de las 10');
  if (d.fin < 6 * 60 || d.fin > 7 * 60) f.push('termina fuera de la mañana de escuela');
  const antesDeEscuela = [0, 1, 2, 3, 4];
  const mismas = d.noches.length === antesDeEscuela.length && antesDeEscuela.every((n) => d.noches.includes(n));
  if (!mismas) f.push('no son las noches antes de escuela');
  if (!d.excepciones.includes('mama')) f.push('Mamá no puede llamar');
  if (d.excepciones.some((c) => c !== 'mama')) f.push('deja pasar a alguien más');
  if (d.silenciarAlarmas) f.push('silencia la alarma');
  return f;
}

/** ¿Un aviso del domingo a las 11:02 pm de este canal habría sonado? */
export function sonariaElDomingoALas11(canal: CanalId, d: HoraDeDormir) {
  if (!d.activo || !d.noches.includes(0)) return true;
  const t = 23 * 60 + 2;
  const dentro = d.inicio <= t;
  return dentro ? d.excepciones.includes(canal) : true;
}

// ── El laboratorio ──

type Acto = 'inicio' | 'uno' | 'dos' | 'tres' | 'cierre';
type Pantalla =
  | 'inicio'
  | 'tarea'
  | 'mensajes'
  | 'chat'
  | 'juego'
  | 'videos'
  | 'ajustes'
  | 'notificaciones'
  | 'notif-app'
  | 'bienestar'
  | 'dormir'
  | 'centro';

export const MISIONES: Record<'uno' | 'dos' | 'tres', { titulo: string; texto: string }> = {
  uno: {
    titulo: 'Misión 1 · El teléfono te interrumpe de más',
    texto: 'Que con tus ajustes el teléfono no te hubiera interrumpido más de 10 veces al día la semana pasada (70 a la semana), sin dejar de oír a Mamá.',
  },
  dos: {
    titulo: 'Misión 2 · Viernes, 8:10 pm',
    texto: 'Termina la tarea de mate antes de la cena (8:45) y no dejes a Mamá esperando más de 5 minutos.',
  },
  tres: {
    titulo: 'Misión 3 · Ya es de noche',
    texto: 'Que en las noches antes de un día de escuela nada te despierte ni te tiente después de las 10, que la alarma de las 6:30 siga sonando y que Mamá sí pueda llamarte.',
  },
};

interface Mensaje {
  con?: CanalId;
  en?: Acto;
  de: 'yo' | CanalId;
  texto: string;
  hora: string;
}

export function LabEquilibrioDigital(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, 3);

  const [acto, setActo] = useState<Acto>('inicio');
  const [pantalla, setPantalla] = useState<Pantalla>('inicio');
  const [appAbierta, setAppAbierta] = useState<AppAvisos>('mensajes');
  const [chat, setChat] = useState<CanalId>('mama');
  const [ajustes, setAjustes] = useState<AjustesAvisos>(AJUSTES_DE_FABRICA);
  const [tarde, setTarde] = useState<Tarde>(TARDE_INICIAL);
  const [dormir, setDormir] = useState<HoraDeDormir>(DORMIR_DE_FABRICA);
  const [respuesta, setRespuesta] = useState('');
  const [revisa, setRevisa] = useState(false);
  const [borrador, setBorrador] = useState('');
  const [banner, setBanner] = useState<{ canal: CanalId; texto: string } | null>(null);
  const [extras, setExtras] = useState<Mensaje[]>([]);
  const [historial, setHistorial] = useState<string[]>([
    'Es viernes, 7:55 pm. Tienes tarea de mate y la cena es a las 8:45. Este es tu teléfono: todo se hace en él.',
  ]);
  const dichos = useRef(new Set<string>());
  const decir = (l: string) => setHistorial((p) => [...p, l]);
  const decirUnaVez = (k: string, l: string) => {
    if (dichos.current.has(k)) return;
    dichos.current.add(k);
    decir(l);
  };

  const estado = estadoDeLaTarde(tarde);
  const cumplida =
    acto === 'uno' ? mision1Cumple(ajustes) : acto === 'dos' ? estado === 'lista' : acto === 'tres' ? faltasDeDormir(dormir).length === 0 : false;

  const avanzado = useRef({ uno: false, dos: false, tres: false });
  const { avanzar } = lab;
  useEffect(() => {
    if ((acto === 'uno' || acto === 'dos' || acto === 'tres') && cumplida && !avanzado.current[acto]) {
      avanzado.current[acto] = true;
      avanzar();
    }
  }, [acto, cumplida, avanzar]);

  // Lo que dice la tarde cuando se tuerce, una vez por tarde.
  const tardeN = useRef(0);
  useEffect(() => {
    if (acto !== 'dos') return;
    if (estado === 'mama-esperando-de-mas')
      decirUnaVez(
        `mama-${tardeN.current}`,
        'Mamá toca la puerta preocupada: pensó que no habías visto su mensaje. No hiciste nada malo: este aviso era de los que no esperan. Puedes repetir la tarde desde la app Tarea.',
      );
    if (estado === 'sin-terminar-a-la-cena')
      decirUnaVez(`cena-${tardeN.current}`, 'Ya son más de las 8:45: te llaman a cenar y la tarea se queda a medias. Puedes repetir la tarde desde la app Tarea.');
    if (estado === 'lista') decirUnaVez('lista', 'Tarea terminada antes de cenar, y Mamá supo que ya ibas. El meme del grupo sigue ahí para después.');
  }, [acto, estado]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mover el reloj (sólo en la misión 2) ──
  const correr = (minutos: number) => {
    if (acto !== 'dos' || estadoDeLaTarde(tarde) !== 'en-curso') return tarde;
    const nueva = correrReloj(tarde, minutos, ajustes);
    const nuevosQueSonaron = nueva.llegados.slice(tarde.llegados.length).filter((l) => l.sono);
    if (nuevosQueSonaron.length > 0) {
      const ultimo = nuevosQueSonaron[nuevosQueSonaron.length - 1];
      setBanner({ canal: ultimo.canal, texto: ultimo.texto });
      decirUnaVez('sonar', 'Cada aviso que suena te saca un poco aunque no lo abras: unos 2 minutos en volver a concentrarte.');
    }
    setTarde(nueva);
    return nueva;
  };

  // ── Los actos ──
  const empezar = () => {
    decir('Abre Ajustes → Bienestar digital: ahí está lo que tu teléfono hizo la semana pasada.');
    setActo('uno');
  };
  const aActo2 = () => {
    decir('8:10 pm. Abre la app Tarea. El reloj del teléfono avanza con lo que haces.');
    setPantalla('inicio');
    setTarde(TARDE_INICIAL);
    setActo('dos');
  };
  const aActo3 = () => {
    setBanner({ canal: 'kevin', texto: 'oye, ¿sigues despierto? te cambio el arma del evento' });
    decir('Domingo, 11:02 pm. Mañana hay escuela. Kevin te acaba de escribir.');
    setPantalla('inicio');
    setActo('tres');
  };
  const cerrar = () => {
    decir('No apagaste el teléfono ni lo dejaste mandar: elegiste qué suena, cuándo, y para quién sí estás siempre.');
    setActo('cierre');
  };
  const repetirTarde = () => {
    tardeN.current += 1;
    setTarde(TARDE_INICIAL);
    setExtras((p) => p.filter((m) => m.en !== 'dos'));
    setBanner(null);
    setRespuesta('');
    setRevisa(false);
    decir('Otra vez las 8:10 pm. Tus ajustes se quedan como los dejaste.');
  };

  // ── Las apps ──
  const abrirApp = (p: Pantalla) => {
    setBanner(null);
    if (acto === 'dos' && (p === 'juego' || p === 'videos')) {
      correr(COSTO_ABRIR[p] ?? 0);
      if (p === 'juego')
        decirUnaVez(
          'cofre',
          'El cofre «gratis» pide ver un anuncio; apenas termina, aparece OTRO cofre por tiempo limitado. El reloj nunca se acaba de verdad: está hecho para que sigas mirando. Se fueron 8 minutos.',
        );
      else decirUnaVez('videos', 'Un video lleva a otro. Se fueron 6 minutos.');
    }
    setPantalla(p);
  };

  const abrirChat = (c: CanalId) => {
    setBanner(null);
    const sinLeer = acto === 'dos' && tarde.llegados.some((l) => l.canal === c);
    if (sinLeer && (c === 'grupo' || c === 'kevin')) {
      correr(COSTO_ABRIR[c] ?? 0);
      if (c === 'grupo') decirUnaVez('grupo', 'Lees treinta mensajes del grupo. Cuando regresas a la tarea ya no te acuerdas en qué ibas: 5 minutos.');
    }
    setChat(c);
    setPantalla('chat');
  };

  const tocarBanner = () => {
    if (!banner) return;
    const app = CANAL[banner.canal].app;
    if (app === 'mensajes') abrirChat(banner.canal);
    else abrirApp(app === 'juego' ? 'juego' : 'videos');
  };

  const enviarEjercicio = () => {
    if (acto !== 'dos' || estado !== 'en-curso' || tarde.resueltos >= EJERCICIOS.length) return;
    const n = Number(respuesta.replace(/[$\s,]/g, ''));
    if (!Number.isFinite(n) || respuesta.trim() === '' || n !== EJERCICIOS[tarde.resueltos].respuesta) {
      setRevisa(true);
      return;
    }
    setRevisa(false);
    setRespuesta('');
    const nueva = correrReloj(tarde, MIN_POR_EJERCICIO, ajustes);
    const resueltos = tarde.resueltos + 1;
    const final = { ...nueva, resueltos, terminoA: resueltos === EJERCICIOS.length ? nueva.reloj : null };
    const sonaron = nueva.llegados.slice(tarde.llegados.length).filter((l) => l.sono);
    if (sonaron.length > 0) {
      const u = sonaron[sonaron.length - 1];
      setBanner({ canal: u.canal, texto: u.texto });
      decirUnaVez('sonar', 'Cada aviso que suena te saca un poco aunque no lo abras: unos 2 minutos en volver a concentrarte.');
    }
    setTarde(final);
  };

  const enviarMensaje = () => {
    const texto = borrador.trim();
    if (!texto) return;
    setBorrador('');
    const cuando = acto === 'dos' ? hora(tarde.reloj) : acto === 'tres' ? '11:03 pm' : '7:56 pm';
    const marca = { con: chat, en: acto };
    setExtras((p) => [...p, { ...marca, de: 'yo', texto, hora: cuando }]);
    if (acto === 'dos' && chat === 'mama' && tarde.mamaLlego !== null && tarde.mamaContestada === null) {
      const t = correrReloj(tarde, 1, ajustes);
      setTarde({ ...t, mamaContestada: tarde.reloj + 1 });
      setExtras((p) => [...p, { ...marca, de: 'mama', texto: 'Ok 👍', hora: hora(tarde.reloj + 1) }]);
      decirUnaVez('mama-ok', `«${texto}» — unas palabras y sigues con lo tuyo. Contestar rápido a lo que sí importa no te saca de nada.`);
    }
    if (acto === 'tres' && chat === 'kevin') {
      setExtras((p) => [...p, { ...marca, de: 'kevin', texto: 'va, ¿cuál quieres? tengo tres 😎', hora: '11:04 pm' }]);
      decirUnaVez('kevin', 'Kevin contesta enseguida y ya van tres mensajes. Mañana entras a las 7: un intercambio de un juego siempre puede esperar a que hayas dormido.');
    }
  };

  const cambiarCanal = (c: CanalId) => {
    const nuevo = { ...ajustes, canales: { ...ajustes.canales, [c]: !ajustes.canales[c] } };
    setAjustes(nuevo);
    if (c === 'mama' && !nuevo.canales.mama)
      decirUnaVez('mama-off', 'Silenciaste hasta a Mamá. Si de verdad pasa algo, no te vas a enterar a tiempo.');
  };
  const cambiarApp = (app: AppAvisos) => {
    const nuevo = { ...ajustes, apps: { ...ajustes.apps, [app]: !ajustes.apps[app] } };
    setAjustes(nuevo);
    if (app === 'mensajes' && !nuevo.apps.mensajes)
      decirUnaVez('mensajes-off', 'Apagaste Mensajes entera: con el grupo se fue también Mamá.');
  };

  const terminar = () => lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000));

  // ── Lo que se pinta ──
  if (lab.terminado) {
    return (
      <VentanaBase marca="Tecnia Avisos" subtitulo="Equilibrio digital">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">🧘</p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Sabe elegir cuándo conectarse</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Miraste tus datos, callaste lo que podía esperar sin callar a Mamá, terminaste la tarea antes de cenar y le dejaste al
            teléfono una hora de dormir que sí te protege. El equilibrio no es una regla fija: es elegir cada vez.
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

  const enTelefono = acto !== 'inicio' && acto !== 'cierre';
  const relojTexto = acto === 'dos' ? hora(tarde.reloj) : acto === 'tres' ? '11:02 pm' : '7:55 pm';
  const dia = acto === 'tres' ? 'Domingo' : 'Viernes';
  const enCentro = acto === 'dos' ? tarde.llegados : [];

  const conversacion = (c: CanalId): Mensaje[] => {
    const base: Mensaje[] =
      c === 'mama'
        ? [{ de: 'mama', texto: '¿Llevas el suéter mañana? Va a hacer frío', hora: 'Ayer' }]
        : c === 'grupo'
          ? [{ de: 'grupo', texto: 'Tomás: ¿quién va al partido?', hora: 'Ayer' }]
          : [{ de: 'kevin', texto: 'gg', hora: 'Ayer' }];
    const tardeMsgs = (acto === 'dos' ? tarde.llegados : []).filter((l) => l.canal === c).map((l) => ({ de: c, texto: l.texto, hora: hora(l.min) }) as Mensaje);
    const noche: Mensaje[] = acto === 'tres' && c === 'kevin' ? [{ de: 'kevin', texto: 'oye, ¿sigues despierto? te cambio el arma del evento', hora: '11:02 pm' }] : [];
    const mios = extras.filter((m) => m.con === c);
    return [...base, ...tardeMsgs, ...noche, ...mios];
  };

  return (
    <VentanaBase marca="Tecnia Avisos" subtitulo="Equilibrio digital">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 p-4 sm:p-6">
        <div className="flex justify-center">
          <div
            className="relative w-full max-w-[380px] rounded-[2.6rem] border-[6px] border-slate-800 bg-gradient-to-b from-[#101935] via-[#0b1124] to-[#05070f] shadow-[0_0_60px_rgba(56,189,248,0.25)] overflow-hidden"
            data-testid="tel"
          >
            <div className="flex items-center justify-between px-6 pt-3 pb-2 text-xs font-bold text-slate-200">
              <span data-testid="tel-reloj">{relojTexto}</span>
              <span className="text-slate-400">{dia}</span>
              {enTelefono ? (
                <button type="button" data-testid="tel-abrir-centro" onClick={() => setPantalla('centro')} className="text-slate-200" aria-label="Centro de notificaciones">
                  🔔 {enCentro.length}
                </button>
              ) : (
                <span>🔋</span>
              )}
            </div>

            {banner && enTelefono && (
              <div className="absolute left-3 right-3 top-9 z-10 rounded-2xl bg-slate-100 text-slate-900 shadow-xl flex items-start gap-2 p-3" data-testid="tel-banner" data-canal={banner.canal}>
                <button type="button" className="flex-1 text-left" onClick={tocarBanner} data-testid="tel-banner-abrir">
                  <span className="block text-xs font-extrabold" style={{ color: APPS[CANAL[banner.canal].app].color }}>
                    {APPS[CANAL[banner.canal].app].icono} {CANAL[banner.canal].app === 'mensajes' ? CANAL[banner.canal].nombre : APPS[CANAL[banner.canal].app].nombre}
                  </span>
                  <span className="block text-sm font-semibold">{banner.texto}</span>
                </button>
                <button type="button" aria-label="Descartar aviso" data-testid="tel-banner-cerrar" onClick={() => setBanner(null)} className="text-slate-500 font-bold px-1">
                  ×
                </button>
              </div>
            )}

            <div className="min-h-[560px] px-4 pb-4 flex flex-col">
              {!enTelefono ? (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center px-6">
                  {acto === 'inicio' ? 'Pantalla bloqueada · 7:55 pm' : 'Pantalla apagada. Buenas noches.'}
                </div>
              ) : pantalla === 'inicio' ? (
                <PantallaInicio onAbrir={abrirApp} />
              ) : (
                <div className="flex-1 flex flex-col gap-3">
                  <button type="button" data-testid="tel-inicio" onClick={() => setPantalla('inicio')} className="self-start text-sky-300 font-bold text-sm">
                    ‹ Inicio
                  </button>

                  {pantalla === 'tarea' && (
                    <AppTarea
                      acto={acto}
                      tarde={tarde}
                      estado={estado}
                      respuesta={respuesta}
                      revisa={revisa}
                      onRespuesta={(v) => {
                        setRespuesta(v);
                        setRevisa(false);
                      }}
                      onEnviar={enviarEjercicio}
                      onRepetir={repetirTarde}
                    />
                  )}

                  {pantalla === 'mensajes' && (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-white font-extrabold text-lg">Mensajes</h3>
                      {(['mama', 'grupo', 'kevin'] as CanalId[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          data-testid={`chat-${c}`}
                          onClick={() => abrirChat(c)}
                          className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-3 py-3 text-left"
                        >
                          <span className="text-2xl" aria-hidden="true">{c === 'mama' ? '👩' : c === 'grupo' ? '👥' : '🧑'}</span>
                          <span className="text-white font-bold flex-1">{CANAL[c].nombre}</span>
                          {!suena(c, ajustes) && <span className="text-xs text-slate-400">🔕</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  {pantalla === 'chat' && (
                    <div className="flex-1 flex flex-col gap-2" data-testid="chat-abierto" data-chat={chat}>
                      <h3 className="text-white font-extrabold">{CANAL[chat].nombre}</h3>
                      <div className="flex-1 flex flex-col gap-2">
                        {conversacion(chat).map((m, i) => (
                          <p
                            key={i}
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.de === 'yo' ? 'self-end bg-sky-500 text-slate-950 font-semibold' : 'self-start bg-white/10 text-slate-100'}`}
                          >
                            {m.texto}
                            <span className="block text-[10px] opacity-70">{m.hora}</span>
                          </p>
                        ))}
                      </div>
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          enviarMensaje();
                        }}
                      >
                        <input
                          data-testid="chat-cuadro"
                          value={borrador}
                          onChange={(e) => setBorrador(e.target.value)}
                          placeholder="Mensaje"
                          aria-label={`Escríbele a ${CANAL[chat].nombre}`}
                          className="flex-1 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-white"
                        />
                        <button type="submit" data-testid="chat-enviar" className="rounded-full bg-sky-500 px-4 font-bold text-slate-950">
                          Enviar
                        </button>
                      </form>
                    </div>
                  )}

                  {pantalla === 'juego' && (
                    <div className="flex-1 rounded-2xl bg-gradient-to-b from-rose-600 to-fuchsia-900 p-5 text-center flex flex-col gap-3 items-center justify-center" data-testid="app-juego">
                      <p className="text-5xl" aria-hidden="true">🎁</p>
                      <p className="text-white font-extrabold text-xl">¡Cofre legendario!</p>
                      <p className="text-rose-100 text-sm">Mira un anuncio para abrirlo · <b>1:59 restantes</b></p>
                      <p className="text-rose-200 text-xs">Después de este: «Cofre épico, sólo por hoy».</p>
                    </div>
                  )}

                  {pantalla === 'videos' && (
                    <div className="flex-1 rounded-2xl bg-gradient-to-b from-amber-500 to-orange-800 p-5 flex flex-col gap-2 justify-center" data-testid="app-videos">
                      <p className="text-white font-extrabold">10 jugadas imposibles</p>
                      <p className="text-amber-100 text-sm">Siguiente en 3… «20 jugadas todavía más imposibles»</p>
                    </div>
                  )}

                  {pantalla === 'ajustes' && (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-white font-extrabold text-lg">Ajustes</h3>
                      <FilaAjuste testid="ajustes-bienestar" icono="📊" texto="Bienestar digital" onClick={() => setPantalla('bienestar')} />
                      <FilaAjuste testid="ajustes-notificaciones" icono="🔔" texto="Notificaciones" onClick={() => setPantalla('notificaciones')} />
                      <FilaAjuste testid="ajustes-dormir" icono="🌙" texto="Hora de dormir" onClick={() => setPantalla('dormir')} />
                    </div>
                  )}

                  {pantalla === 'bienestar' && <Bienestar ajustes={ajustes} onNotificaciones={() => setPantalla('notificaciones')} />}

                  {pantalla === 'notificaciones' && (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-white font-extrabold text-lg">Notificaciones</h3>
                      <p className="text-sm text-slate-300" data-testid="notif-total">
                        Con estos ajustes, la semana pasada te habrían sonado <b className="text-white">{avisosQueSuenan(ajustes)}</b> avisos (
                        {Math.round(avisosQueSuenan(ajustes) / 7)} al día).
                      </p>
                      {(Object.keys(APPS) as AppAvisos[]).map((app) => (
                        <FilaAjuste
                          key={app}
                          testid={`notif-app-${app}`}
                          icono={APPS[app].icono}
                          texto={APPS[app].nombre}
                          detalle={ajustes.apps[app] ? `${CANALES.filter((c) => c.app === app).reduce((n, c) => n + c.semana, 0)} avisos la semana pasada` : 'Apagadas'}
                          onClick={() => {
                            setAppAbierta(app);
                            setPantalla('notif-app');
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {pantalla === 'notif-app' && (
                    <div className="flex flex-col gap-2" data-testid="notif-detalle" data-app={appAbierta}>
                      <h3 className="text-white font-extrabold text-lg">
                        {APPS[appAbierta].icono} {APPS[appAbierta].nombre}
                      </h3>
                      <Interruptor testid={`notif-app-switch-${appAbierta}`} texto="Permitir notificaciones" encendido={ajustes.apps[appAbierta]} onCambiar={() => cambiarApp(appAbierta)} />
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mt-2">Categorías</p>
                      {CANALES.filter((c) => c.app === appAbierta).map((c) => (
                        <Interruptor
                          key={c.id}
                          testid={`notif-canal-${c.id}`}
                          texto={c.nombre}
                          detalle={`${c.semana} la semana pasada`}
                          encendido={ajustes.canales[c.id]}
                          deshabilitado={!ajustes.apps[appAbierta]}
                          onCambiar={() => cambiarCanal(c.id)}
                        />
                      ))}
                      <p className="text-xs text-slate-400">Silenciado = llega al centro de notificaciones sin sonar ni salir arriba.</p>
                      <button type="button" onClick={() => setPantalla('notificaciones')} className="self-start text-sky-300 font-bold text-sm" data-testid="notif-volver">
                        ‹ Notificaciones
                      </button>
                    </div>
                  )}

                  {pantalla === 'dormir' && <AjusteDormir d={dormir} onCambiar={setDormir} />}

                  {pantalla === 'centro' && (
                    <div className="flex flex-col gap-2" data-testid="tel-centro">
                      <h3 className="text-white font-extrabold text-lg">Notificaciones</h3>
                      {enCentro.length === 0 ? (
                        <p className="text-slate-400 text-sm">No hay notificaciones.</p>
                      ) : (
                        [...enCentro].reverse().map((l) => (
                          <div key={l.id} className="rounded-2xl bg-white/10 px-3 py-2" data-aviso={l.id} data-sono={l.sono ? 'si' : 'no'}>
                            <p className="text-xs font-bold" style={{ color: APPS[CANAL[l.canal].app].color }}>
                              {APPS[CANAL[l.canal].app].icono} {CANAL[l.canal].app === 'mensajes' ? CANAL[l.canal].nombre : APPS[CANAL[l.canal].app].nombre} · {hora(l.min)} {l.sono ? '' : '· 🔕'}
                            </p>
                            <p className="text-sm text-slate-100">{l.texto}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mx-auto mb-2 h-1.5 w-32 rounded-full bg-slate-600" aria-hidden="true" />
          </div>
        </div>

        <aside className="bg-[#0b1220] border border-cyan-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit" data-testid="bit-panel">
          {(acto === 'uno' || acto === 'dos' || acto === 'tres') && (
            <div className="rounded-xl bg-cyan-500/10 border border-cyan-400/40 p-3" data-testid="eq-mision" data-cumplida={cumplida ? 'si' : 'no'}>
              <p className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">{MISIONES[acto].titulo}</p>
              <p className="text-sm text-white font-semibold mt-1">{MISIONES[acto].texto}</p>
              {cumplida ? (
                <p className="text-sm text-cyan-100 mt-2" data-testid="eq-cumplida">✔ Misión cumplida.</p>
              ) : (
                <p className="text-xs text-slate-400 mt-2">Todo se hace en el teléfono.</p>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2" data-testid="eq-historial">
            {historial.map((l, i) => (
              <p key={i} className="text-sm text-slate-200 leading-relaxed">{l}</p>
            ))}
          </div>
          {acto === 'inicio' && (
            <button type="button" onClick={empezar} data-testid="eq-seguir" className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Desbloquear el teléfono
            </button>
          )}
          {cumplida && (acto === 'uno' || acto === 'dos' || acto === 'tres') && (
            <button type="button" onClick={acto === 'uno' ? aActo2 : acto === 'dos' ? aActo3 : cerrar} data-testid="eq-seguir" className="px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold">
              Seguir
            </button>
          )}
          {acto === 'cierre' && (
            <button type="button" onClick={terminar} data-testid="eq-terminar" className="px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold">
              Terminar
            </button>
          )}
        </aside>
      </div>
    </VentanaBase>
  );
}

// ── Piezas del teléfono ──

function PantallaInicio({ onAbrir }: { onAbrir: (p: Pantalla) => void }) {
  const apps: Array<{ p: Pantalla; nombre: string; icono: string; color: string }> = [
    { p: 'tarea', nombre: 'Tarea', icono: '📘', color: '#0ea5e9' },
    { p: 'mensajes', nombre: 'Mensajes', icono: '💬', color: APPS.mensajes.color },
    { p: 'juego', nombre: 'Reino de Cristal', icono: '🎮', color: APPS.juego.color },
    { p: 'videos', nombre: 'TecniaTube', icono: '▶️', color: APPS.videos.color },
    { p: 'ajustes', nombre: 'Ajustes', icono: '⚙️', color: '#64748b' },
  ];
  return (
    <div className="grid grid-cols-3 gap-4 pt-8" data-testid="tel-pantalla-inicio">
      {apps.map((a) => (
        <button key={a.p} type="button" data-testid={`tel-app-${a.p}`} onClick={() => onAbrir(a.p)} className="flex flex-col items-center gap-1.5">
          <span
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
            style={{ background: a.color, boxShadow: `0 0 22px ${a.color}66` }}
            aria-hidden="true"
          >
            {a.icono}
          </span>
          <span className="text-xs font-bold text-slate-100 text-center leading-tight">{a.nombre}</span>
        </button>
      ))}
    </div>
  );
}

function AppTarea({
  acto,
  tarde,
  estado,
  respuesta,
  revisa,
  onRespuesta,
  onEnviar,
  onRepetir,
}: {
  acto: Acto;
  tarde: Tarde;
  estado: EstadoTarde;
  respuesta: string;
  revisa: boolean;
  onRespuesta: (v: string) => void;
  onEnviar: () => void;
  onRepetir: () => void;
}) {
  if (acto !== 'dos') {
    return (
      <div className="rounded-2xl bg-sky-950/60 border border-sky-500/30 p-4">
        <h3 className="text-white font-extrabold">📘 Tarea</h3>
        <p className="text-sky-100 text-sm mt-1">{acto === 'uno' ? 'Mate: 5 ejercicios para el lunes. La empiezas a las 8:10.' : 'Todo entregado. 🎉'}</p>
      </div>
    );
  }
  const actual = EJERCICIOS[tarde.resueltos];
  return (
    <div className="rounded-2xl bg-sky-950/60 border border-sky-500/30 p-4 flex flex-col gap-3" data-testid="app-tarea">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-extrabold">📘 Mate · 1.º B</h3>
        <span className="text-sky-200 text-sm font-bold" data-testid="tarea-progreso">
          {tarde.resueltos} / {EJERCICIOS.length}
        </span>
      </div>
      <div className="h-2 rounded-full bg-sky-900 overflow-hidden">
        <div className="h-full bg-sky-400" style={{ width: `${(tarde.resueltos / EJERCICIOS.length) * 100}%` }} />
      </div>
      {estado === 'en-curso' && actual ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onEnviar();
          }}
        >
          <p className="text-white font-semibold" data-testid="tarea-ejercicio">
            {tarde.resueltos + 1}. {actual.enunciado}
          </p>
          <div className="flex gap-2">
            <input
              data-testid="tarea-respuesta"
              inputMode="decimal"
              value={respuesta}
              onChange={(e) => onRespuesta(e.target.value)}
              aria-label="Tu respuesta"
              className="flex-1 rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-white"
            />
            <button type="submit" data-testid="tarea-enviar" className="rounded-xl bg-sky-400 px-4 font-bold text-slate-950">
              Listo
            </button>
          </div>
          {revisa && (
            <p className="text-amber-300 text-sm" data-testid="tarea-revisa">
              Revísalo otra vez.
            </p>
          )}
        </form>
      ) : estado === 'lista' || (tarde.terminoA !== null && estado === 'en-curso') ? (
        <p className="text-emerald-300 font-bold" data-testid="tarea-terminada">
          ✔ Tarea terminada a las {hora(tarde.terminoA ?? tarde.reloj)}.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-amber-200 text-sm">
            {estado === 'mama-esperando-de-mas' ? 'Mamá vino a buscarte.' : 'Ya pasó la hora de cenar.'}
          </p>
          <button type="button" data-testid="tarea-repetir" onClick={onRepetir} className="self-start rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950">
            Repetir la tarde desde las 8:10
          </button>
        </div>
      )}
    </div>
  );
}

function Bienestar({ ajustes, onNotificaciones }: { ajustes: AjustesAvisos; onNotificaciones: () => void }) {
  const max = Math.max(...USO_SEMANA.map((u) => u.minutos));
  const maxHora = Math.max(...USO_POR_HORA.map((u) => u.minutos));
  const hm = (m: number) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
  return (
    <div className="flex flex-col gap-3" data-testid="bienestar">
      <h3 className="text-white font-extrabold text-lg">Bienestar digital</h3>
      <section className="rounded-2xl bg-white/5 border border-white/10 p-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Tiempo de pantalla · semana pasada</p>
        <p className="text-2xl font-extrabold text-white">{hm(USO_SEMANA.reduce((n, u) => n + u.minutos, 0))}</p>
        <div className="flex flex-col gap-1.5 mt-2">
          {USO_SEMANA.map((u) => (
            <div key={u.app} className="text-xs text-slate-200">
              <div className="flex justify-between">
                <span>
                  {u.icono} {u.app}
                </span>
                <span className="tabular-nums">{hm(u.minutos)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${(u.minutos / max) * 100}%`, background: u.color }} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl bg-white/5 border border-white/10 p-3" data-testid="bienestar-horas">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Noches de escuela · minutos por hora</p>
        <div className="flex items-end gap-1.5 h-24 mt-2">
          {USO_POR_HORA.map((u) => (
            <div key={u.hora} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: `${(u.minutos / maxHora) * 72}px` }}>
                <div className="w-full bg-slate-500 rounded-t" style={{ height: `${((u.minutos - u.juego) / u.minutos) * 100}%` }} />
                <div className="w-full bg-rose-500" style={{ height: `${(u.juego / u.minutos) * 100}%` }} />
              </div>
              <span className="text-[9px] text-slate-400 whitespace-nowrap">{u.hora}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          <span className="inline-block w-2 h-2 bg-rose-500 rounded-sm mr-1" />Reino de Cristal <span className="inline-block w-2 h-2 bg-slate-500 rounded-sm mx-1" />
          lo demás
        </p>
      </section>
      <button type="button" onClick={onNotificaciones} className="rounded-2xl bg-white/5 border border-white/10 p-3 text-left" data-testid="bienestar-avisos">
        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Notificaciones · semana pasada</p>
        <p className="text-white font-extrabold">
          {CANALES.reduce((n, c) => n + c.semana, 0)} recibidas · {avisosQueSuenan(ajustes)} sonarían con tus ajustes ›
        </p>
      </button>
    </div>
  );
}

function AjusteDormir({ d, onCambiar }: { d: HoraDeDormir; onCambiar: (d: HoraDeDormir) => void }) {
  const set = (p: Partial<HoraDeDormir>) => onCambiar({ ...d, ...p });
  const alternarNoche = (n: number) => set({ noches: d.noches.includes(n) ? d.noches.filter((x) => x !== n) : [...d.noches, n].sort() });
  const alternarExc = (c: CanalId) => set({ excepciones: d.excepciones.includes(c) ? d.excepciones.filter((x) => x !== c) : [...d.excepciones, c] });
  const kevin = sonariaElDomingoALas11('kevin', d);
  return (
    <div className="flex flex-col gap-2" data-testid="dormir">
      <h3 className="text-white font-extrabold text-lg">🌙 Hora de dormir</h3>
      <Interruptor testid="dormir-activo" texto="Activar" encendido={d.activo} onCambiar={() => set({ activo: !d.activo })} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-300 font-bold flex flex-col gap-1">
          Empieza
          <select data-testid="dormir-inicio" value={d.inicio} onChange={(e) => set({ inicio: Number(e.target.value) })} className="rounded-xl bg-white/10 border border-white/20 px-2 py-2 text-white">
            {OPCIONES_INICIO.map((m) => (
              <option key={m} value={m} className="text-slate-900">
                {reloj24(m)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-300 font-bold flex flex-col gap-1">
          Termina
          <select data-testid="dormir-fin" value={d.fin} onChange={(e) => set({ fin: Number(e.target.value) })} className="rounded-xl bg-white/10 border border-white/20 px-2 py-2 text-white">
            {OPCIONES_FIN.map((m) => (
              <option key={m} value={m} className="text-slate-900">
                {reloj24(m)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-slate-300 font-bold">Se activa la noche de:</p>
      <div className="flex gap-1.5">
        {NOCHES.map((n, i) => (
          <button
            key={n}
            type="button"
            data-testid={`dormir-noche-${i}`}
            aria-pressed={d.noches.includes(i)}
            onClick={() => alternarNoche(i)}
            className={`flex-1 rounded-full py-1.5 text-xs font-bold border-2 ${d.noches.includes(i) ? 'bg-indigo-500 border-indigo-300 text-white' : 'border-slate-600 text-slate-300'}`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-300 font-bold mt-1">Pueden sonar aunque esté activa:</p>
      {(['mama', 'grupo', 'kevin'] as CanalId[]).map((c) => (
        <Interruptor key={c} testid={`dormir-excepcion-${c}`} texto={CANAL[c].nombre} encendido={d.excepciones.includes(c)} onCambiar={() => alternarExc(c)} />
      ))}
      <Interruptor testid="dormir-alarmas" texto="Silenciar también las alarmas" detalle="Alarma de la escuela: 6:30 am, lun a vie" encendido={d.silenciarAlarmas} onCambiar={() => set({ silenciarAlarmas: !d.silenciarAlarmas })} />
      <p className="rounded-xl bg-indigo-950/70 border border-indigo-500/40 px-3 py-2 text-xs text-indigo-100" data-testid="dormir-resumen">
        {d.activo
          ? `Activa las noches de ${d.noches.map((n) => NOCHES[n]).join(', ') || 'ninguna'}, de ${reloj24(d.inicio)} a ${reloj24(d.fin)}. Esta noche, el mensaje de Kevin de las 11:02 ${kevin ? 'habría sonado' : 'habría llegado en silencio'}.`
          : 'Apagada: esta noche todo suena a cualquier hora.'}
      </p>
    </div>
  );
}

function FilaAjuste({ testid, icono, texto, detalle, onClick }: { testid: string; icono: string; texto: string; detalle?: string; onClick: () => void }) {
  return (
    <button type="button" data-testid={testid} onClick={onClick} className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-3 py-3 text-left">
      <span className="text-xl" aria-hidden="true">{icono}</span>
      <span className="flex-1">
        <span className="block text-white font-bold">{texto}</span>
        {detalle && <span className="block text-xs text-slate-400">{detalle}</span>}
      </span>
      <span className="text-slate-500" aria-hidden="true">›</span>
    </button>
  );
}

function Interruptor({
  testid,
  texto,
  detalle,
  encendido,
  deshabilitado,
  onCambiar,
}: {
  testid: string;
  texto: string;
  detalle?: string;
  encendido: boolean;
  deshabilitado?: boolean;
  onCambiar: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={encendido}
      data-testid={testid}
      disabled={deshabilitado}
      onClick={onCambiar}
      className={`flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-3 py-2.5 text-left ${deshabilitado ? 'opacity-40' : ''}`}
    >
      <span className="flex-1">
        <span className="block text-white text-sm font-semibold">{texto}</span>
        {detalle && <span className="block text-xs text-slate-400">{detalle}</span>}
      </span>
      <span className={`w-11 h-6 rounded-full p-0.5 transition-colors ${encendido ? 'bg-emerald-500' : 'bg-slate-600'}`} aria-hidden="true">
        <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${encendido ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}

export default LabEquilibrioDigital;
