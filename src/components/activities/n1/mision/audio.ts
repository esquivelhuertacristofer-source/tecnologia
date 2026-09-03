/**
 * Misión: Aprende Computación — audio.
 *
 * Tonos WebAudio con presets exactos del port + narración con selección de
 * voz. Todo con guards para entornos sin AudioContext/speechSynthesis
 * (SSR, jsdom).
 *
 * Sobre la voz (6-ago-2026): el port original solo fijaba `lang = 'es-MX'`
 * y nunca asignaba `u.voice`, así que el navegador caía siempre en la voz
 * local por defecto — Sabina/Raúl, las SAPI viejas, robóticas. Aquí se
 * elige explícitamente la mejor voz en español disponible puntuándolas:
 * las neuronales de Microsoft ("… Online (Natural)", que Edge sirve desde
 * los servidores de Azure sin costo para el sitio), las de Google y las
 * premium de Apple ganan por mucho; las SAPI locales quedan de último
 * recurso. Este es el mismo criterio que usa la plataforma de bachillerato.
 *
 * El catálogo de voces llega de forma asíncrona (evento `voiceschanged`) y
 * en Edge las remotas llegan en una segunda tanda: por eso hay una espera
 * corta antes de la primera locución, para no gastar la primera frase de
 * Bit con la voz mala.
 */

export type TonoId =
  | 'select'
  | 'correct'
  | 'connect'
  | 'power'
  | 'open'
  | 'close'
  | 'minimize'
  | 'save'
  | 'error'
  | 'complete';

/** Presets [frecuencia Hz, duración s] verbatim del playTone original. */
const PRESETS: Record<TonoId, [number, number]> = {
  select: [430, 0.07],
  correct: [660, 0.13],
  connect: [540, 0.14],
  power: [190, 0.22],
  open: [480, 0.08],
  close: [300, 0.07],
  minimize: [350, 0.08],
  save: [760, 0.16],
  error: [150, 0.18],
  complete: [880, 0.35]
};

// Estado del módulo (sin tocar APIs del navegador en el nivel superior).
let sonidoActivo = true; // soundEnabled original: true por defecto.
let ctxAudio: AudioContext | null = null;

/** window con constructores de audio opcionales (jsdom no los tiene). */
interface VentanaAudio {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

/** AudioContext perezoso singleton, como playTone.ctx en la referencia. */
function obtenerContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctxAudio) return ctxAudio;
  const w = window as unknown as VentanaAudio;
  const Constructor = w.AudioContext ?? w.webkitAudioContext;
  if (!Constructor) return null;
  try {
    ctxAudio = new Constructor();
  } catch {
    return null;
  }
  return ctxAudio;
}

/** Activa/desactiva el sonido; al apagar cancela la voz (toggleSound). */
export function setSonidoActivo(v: boolean): void {
  sonidoActivo = v;
  if (!v) detenerVoz();
}

export function getSonidoActivo(): boolean {
  return sonidoActivo;
}

/** Port exacto de playTone: oscilador seno (sawtooth en 'error') + envolvente. */
export function reproducirTono(tono: TonoId): void {
  if (!sonidoActivo) return;
  try {
    const ctx = obtenerContexto();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const [freq, dur] = PRESETS[tono];
    osc.frequency.value = freq;
    osc.type = tono === 'error' ? 'sawtooth' : 'sine';
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  } catch {
    // AudioContext no disponible o bloqueado: silencio, como el original.
  }
}

// ─── Selección de voz ────────────────────────────────────────────────────────

/**
 * Puntúa una voz: cuanto más alto, más natural suena. Los pesos vienen de la
 * plataforma de bachillerato, donde ya están validados con alumnos.
 */
export function puntuarVoz(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  let s = 0;
  if (/natural|neural/.test(n)) s += 120; // Edge: "… Online (Natural)".
  if (/google/.test(n)) s += 80;
  if (/premium|enhanced|wavenet|studio|siri/.test(n)) s += 60;
  if (v.localService === false) s += 40; // servida en la nube > SAPI local.
  if (/es[-_]MX/i.test(v.lang)) s += 16;
  else if (/es[-_]419/i.test(v.lang)) s += 12;
  else if (/es[-_]US/i.test(v.lang)) s += 8;
  else if (/^es/i.test(v.lang)) s += 4;
  // Las SAPI viejas de Windows: last resort explícito.
  if (/sabina|helena|laura|pablo|raul|microsoft server/.test(n)) s -= 14;
  // Desempate estable: en Edge hay 47 voces en español y varias empatan en
  // 176 puntos (natural + remota + es-MX). Sin esto, la elegida dependería
  // del orden del catálogo, que cambia entre versiones. Dalia es la voz
  // femenina cálida es-MX que quedó como referencia del proyecto.
  if (/\bdalia\b/.test(n)) s += 2;
  return s;
}

/** ¿Es una de las voces que de verdad suenan naturales? */
export function esVozPremium(v: SpeechSynthesisVoice): boolean {
  return /natural|neural|google|premium|enhanced|wavenet|studio/i.test(v.name) || v.localService === false;
}

let vozElegida: SpeechSynthesisVoice | null = null;
let catalogoListo = false;
let catalogoIniciado = false;

/** Relee el catálogo y se queda con la mejor voz en español. */
function refrescarCatalogo(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  let voces: SpeechSynthesisVoice[] = [];
  try {
    voces = window.speechSynthesis.getVoices();
  } catch {
    return;
  }
  if (voces.length === 0) return;
  catalogoListo = true;
  const espanol = voces.filter((v) => /^es/i.test(v.lang));
  // Sin voces en español el navegador hará lo suyo con lang='es-MX'.
  if (espanol.length === 0) {
    vozElegida = null;
    return;
  }
  vozElegida = espanol.slice().sort((a, b) => puntuarVoz(b) - puntuarVoz(a))[0] ?? null;
}

/**
 * Arranca la carga del catálogo. Conviene llamarla al montar la actividad
 * para que la primera frase de Bit ya salga con la voz buena.
 */
export function prepararVoz(): void {
  if (catalogoIniciado) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  catalogoIniciado = true;
  refrescarCatalogo();
  try {
    window.speechSynthesis.addEventListener('voiceschanged', refrescarCatalogo);
  } catch {
    // Navegador sin addEventListener en speechSynthesis: nos quedamos con
    // la lectura inicial.
  }
}

/** Voz en uso y catálogo en español, para diagnóstico desde la consola. */
export function diagnosticoVoz(): {
  elegida: string | null;
  premium: boolean;
  candidatas: { nombre: string; lang: string; local: boolean; puntos: number }[];
} {
  prepararVoz();
  refrescarCatalogo();
  let voces: SpeechSynthesisVoice[] = [];
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      voces = window.speechSynthesis.getVoices();
    } catch {
      voces = [];
    }
  }
  return {
    elegida: vozElegida ? `${vozElegida.name} (${vozElegida.lang})` : null,
    premium: vozElegida ? esVozPremium(vozElegida) : false,
    candidatas: voces
      .filter((v) => /^es/i.test(v.lang))
      .map((v) => ({ nombre: v.name, lang: v.lang, local: v.localService, puntos: puntuarVoz(v) }))
      .sort((a, b) => b.puntos - a.puntos)
  };
}

// ─── Narración ───────────────────────────────────────────────────────────────

/**
 * Trocea el texto por oraciones. Chrome corta la locución a los ~15 s y
 * enmudece el resto: hablando en trozos cortos encadenados no ocurre.
 */
function trocear(texto: string): string[] {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (!limpio) return [];
  const oraciones = limpio.match(/[^.!?]+[.!?]*\s*/g) ?? [limpio];
  const trozos: string[] = [];
  let buffer = '';
  for (const o of oraciones) {
    if ((buffer + o).length > 220 && buffer) {
      trozos.push(buffer.trim());
      buffer = o;
    } else {
      buffer += o;
    }
  }
  if (buffer.trim()) trozos.push(buffer.trim());
  return trozos;
}

/**
 * Generación de locución: cada llamada a decir()/detenerVoz() la incrementa,
 * de modo que los trozos encadenados de una locución vieja se abandonan solos.
 */
let generacion = 0;

function hablarTrozos(trozos: string[], gen: number, volumen = 1): void {
  if (gen !== generacion || trozos.length === 0) return;
  const premium = vozElegida ? esVozPremium(vozElegida) : false;
  const emitir = (i: number): void => {
    if (gen !== generacion || i >= trozos.length) return;
    try {
      const u = new SpeechSynthesisUtterance(trozos[i]);
      u.lang = vozElegida?.lang ?? 'es-MX';
      if (vozElegida) u.voice = vozElegida;
      // Las neuronales ya traen prosodia propia: tocarles el tono las
      // degrada. El pitch juguetón solo se mantiene en la SAPI vieja, que
      // es donde ayudaba.
      u.rate = premium ? 1 : 0.98;
      u.pitch = premium ? 1 : 1.05;
      u.volume = volumen;
      u.onend = () => emitir(i + 1);
      u.onerror = () => emitir(i + 1);
      window.speechSynthesis.speak(u);
    } catch {
      // speechSynthesis incompleto (jsdom): sin narración.
    }
  };
  emitir(0);
}

/**
 * Narra `mensaje` cancelando la locución previa. Solo habla si el sonido
 * está activo y el mensaje es corto (< 135 caracteres) o se fuerza — igual
 * que la referencia.
 */
export function decir(mensaje: string, opciones?: { forzar?: boolean; volumen?: number }): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const forzar = opciones?.forzar ?? false;
  /*
   * `volumen` entró el 11-ago-2026 para el auditorio de §27.3: cuando el
   * alumno se da la vuelta a leer la pantalla, su voz tiene que **irse hacia
   * atrás**, que es literalmente lo que pasa en un salón. Es la única manera
   * honesta de decirlo, porque a `speechSynthesis` no se le puede meter un
   * filtro de Web Audio: la síntesis no pasa por el grafo de audio de la
   * página. Por omisión 1, así que ninguna locución existente cambia.
   */
  const volumen = Math.max(0, Math.min(1, opciones?.volumen ?? 1));
  if (!sonidoActivo || (!forzar && mensaje.length >= 135)) return;
  prepararVoz();
  const gen = ++generacion;
  const trozos = trocear(mensaje);
  if (trozos.length === 0) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    return;
  }
  // Chrome se traga el utterance si speak() va pegado a cancel(); y si el
  // catálogo aún no llegó, esperamos un poco para no estrenar con la voz
  // fea. En cuanto hay catálogo, el retraso es imperceptible.
  const espera = catalogoListo ? 40 : 350;
  window.setTimeout(() => {
    if (gen !== generacion) return;
    refrescarCatalogo();
    hablarTrozos(trozos, gen, volumen);
  }, espera);
}

/** Cancela cualquier locución en curso. */
export function detenerVoz(): void {
  generacion++;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Sin narración disponible.
  }
}
