'use client';

/**
 * Los sonidos que se pueden meter en una diapositiva (§42.2).
 *
 * ── POR QUÉ SE SINTETIZAN Y NO SON ARCHIVOS ─────────────────────────────────
 *
 * Un retumbe de volcán es **ruido grave filtrado**, y sintetizarlo cabe en
 * treinta líneas. Meter un `.mp3` en el árbol costaría un archivo que nadie va
 * a poder sustituir por otro sin tocar código, un peso de descarga en un aula
 * con la conexión que tienen las aulas, y una licencia que rastrear. La
 * decisión se anota aquí para que nadie la «arregle» metiendo un archivo.
 *
 * Y no es un atajo pedagógico: lo que la clase enseña es **cuándo el sonido
 * ayuda**, no de dónde se saca un sonido. Con dos basta —el que es el tema y el
 * que sólo es adorno— y los dos tienen que sonar de verdad para que el alumno
 * pueda comparar.
 *
 * ── LA REGLA DEL NAVEGADOR ──────────────────────────────────────────────────
 *
 * Un `AudioContext` creado antes de que el usuario toque nada nace suspendido.
 * Por eso se crea **al primer clic** y no al cargar, y por eso hay un `resume()`
 * defensivo: en un portátil de aula que vuelve de suspensión, el contexto puede
 * despertarse en `suspended` sin que nadie lo haya pedido.
 */

export interface Sonido {
  id: string;
  nombre: string;
  /** Lo que el alumno lee al elegirlo. Es currículo: dice cuándo sirve. */
  detalle: string;
  segundos: number;
}

export const SONIDOS: Record<string, Sonido> = {
  retumbe: {
    id: 'retumbe',
    nombre: 'Retumbe del volcán',
    detalle: 'Un rugido grave y hondo. Es DE LO QUE HABLA la diapositiva.',
    segundos: 3.2,
  },
  musica: {
    id: 'musica',
    nombre: 'Música de fondo',
    detalle: 'Una melodía suave para toda la presentación. Suena bonita… y tapa tu voz.',
    segundos: 4,
  },
};

let ctx: AudioContext | null = null;
let vivo: { fin: () => void } | null = null;

const contexto = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const Clase = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Clase) return null;
  ctx ??= new Clase();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

/** Corta lo que esté sonando. Dos sonidos a la vez no enseñan nada. */
export function detenerSonido(): void {
  vivo?.fin();
  vivo = null;
}

/**
 * El retumbe: ruido blanco pasado por un filtro grave y un sobre lento.
 *
 * El paso bajo a 110 Hz es lo que lo convierte de «estática de radio» en «algo
 * enorme moviéndose bajo tierra». Con el filtro más arriba suena a viento.
 */
function retumbe(a: AudioContext, salida: GainNode): () => void {
  const seg = SONIDOS.retumbe.segundos;
  const muestras = Math.floor(a.sampleRate * seg);
  const buffer = a.createBuffer(1, muestras, a.sampleRate);
  const datos = buffer.getChannelData(0);
  let ultimo = 0;
  for (let i = 0; i < muestras; i += 1) {
    // Ruido rosa a la brava: un promedio corrido del blanco. Más grave que el
    // blanco puro y sin necesidad de un banco de filtros.
    ultimo = ultimo * 0.965 + (Math.random() * 2 - 1) * 0.035;
    datos[i] = ultimo * 8;
  }
  const fuente = a.createBufferSource();
  fuente.buffer = buffer;

  const grave = a.createBiquadFilter();
  grave.type = 'lowpass';
  grave.frequency.setValueAtTime(70, a.currentTime);
  grave.frequency.linearRampToValueAtTime(190, a.currentTime + seg * 0.4);
  grave.frequency.linearRampToValueAtTime(80, a.currentTime + seg);
  grave.Q.value = 0.9;

  const sobre = a.createGain();
  sobre.gain.setValueAtTime(0, a.currentTime);
  sobre.gain.linearRampToValueAtTime(1, a.currentTime + 0.55);
  sobre.gain.setValueAtTime(1, a.currentTime + seg * 0.6);
  sobre.gain.linearRampToValueAtTime(0, a.currentTime + seg);

  fuente.connect(grave).connect(sobre).connect(salida);
  fuente.start();
  return () => {
    try {
      fuente.stop();
    } catch {
      /* ya había terminado */
    }
  };
}

/** La musiquilla: cuatro notas de triángulo, dulces y perfectamente inútiles. */
function musica(a: AudioContext, salida: GainNode): () => void {
  const notas = [523.25, 659.25, 587.33, 783.99];
  const paso = SONIDOS.musica.segundos / notas.length;
  const osciladores: OscillatorNode[] = [];
  notas.forEach((hz, i) => {
    const o = a.createOscillator();
    o.type = 'triangle';
    o.frequency.value = hz;
    const g = a.createGain();
    const t = a.currentTime + i * paso;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.06);
    g.gain.linearRampToValueAtTime(0, t + paso * 0.95);
    o.connect(g).connect(salida);
    o.start(t);
    o.stop(t + paso);
    osciladores.push(o);
  });
  return () => {
    for (const o of osciladores) {
      try {
        o.stop();
      } catch {
        /* ya había terminado */
      }
    }
  };
}

/**
 * Toca un sonido y devuelve cuántos milisegundos va a durar, o 0 si el equipo
 * no tiene audio. Devolver la duración es lo que le permite a la ventana pintar
 * el altavoz «sonando» sin tener que preguntar por él.
 */
export function reproducirSonido(id: string): number {
  const s = SONIDOS[id];
  const a = contexto();
  if (!s || !a) return 0;
  detenerSonido();

  const maestro = a.createGain();
  maestro.gain.value = id === 'musica' ? 0.16 : 0.42;
  maestro.connect(a.destination);

  const parar = id === 'musica' ? musica(a, maestro) : retumbe(a, maestro);
  vivo = {
    fin: () => {
      parar();
      maestro.disconnect();
    },
  };
  return Math.round(s.segundos * 1000);
}
