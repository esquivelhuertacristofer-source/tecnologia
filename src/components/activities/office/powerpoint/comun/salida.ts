'use client';

import type { Mazo } from '@/components/office/motor-diapos/mazo';
import { animaciones } from '@/components/office/motor-diapos/mazo';

/**
 * La **bandeja de salida** de la sala de PowerPoint (§43.1 y §43.7).
 *
 * Aquí queda apuntado lo que el alumno exportó. No se descarga nada, no se abre
 * el diálogo de impresión del navegador y no se llama a `window.print()`: es un
 * simulador y lo dice en voz alta en el propio cuadro. Lo que sí es de verdad
 * son **las cifras**: el número de páginas, la duración del video y el peso se
 * DERIVAN del mazo, así que si el alumno añade una diapositiva y vuelve a
 * exportar, el archivo nuevo pesa más. Una bandeja con números inventados
 * enseñaría que exportar es magia.
 *
 * ── POR QUÉ ES UN ALMACÉN FUERA DE REACT ────────────────────────────────────
 *
 * Mismo motivo que el escritorio de `of-word-guardar-e-imprimir`, y se copia su
 * forma a propósito: el guion es una constante de módulo y tiene que poder
 * preguntar «¿ya hay un PDF?». Un `logro` de tipo `documento` recibe el mazo, y
 * eso no está en el mazo — está aquí. Los componentes se enganchan con
 * `useSyncExternalStore` y leen **exactamente lo mismo** que lee el maestro.
 *
 * Vive en `comun/` y no en la carpeta de una clase porque lo usan dos: §43.1
 * saca el PDF y §43.7 saca las tres copias y compara sus pesos.
 */

export type FormatoSalida = 'pdf' | 'video' | 'pptx';

export interface ArchivoSalido {
  /** Sin extensión: la pone el formato, como en Windows. */
  nombre: string;
  formato: FormatoSalida;
  /** Kilobytes estimados. Derivado del mazo, nunca escrito a mano. */
  kb: number;
  /** Segundos, sólo para el video. */
  segundos?: number;
  /** Cuántas páginas, sólo para el PDF: una por diapositiva. */
  paginas?: number;
  /** La hora, en `hh:mm`. La pone quien exporta, no el modelo. */
  hora: string;
}

export interface Salida {
  archivos: ArchivoSalido[];
  /** Sólo lectura puesto sobre el archivo de trabajo (§43.7). */
  soloLectura: boolean;
  /** Hay contraseña puesta. No se guarda cuál: no hace falta y no es nuestra. */
  conContrasena: boolean;
}

const VACIA: Salida = { archivos: [], soloLectura: false, conContrasena: false };

let estado: Salida = VACIA;
const oyentes = new Set<() => void>();
let avisar: (() => void) | null = null;

export function suscribir(fn: () => void): () => void {
  oyentes.add(fn);
  return () => {
    oyentes.delete(fn);
  };
}

export const leerSalida = (): Salida => estado;

function cambiar(parche: Partial<Salida>) {
  estado = { ...estado, ...parche };
  oyentes.forEach((fn) => fn());
}

export function reiniciarSalida() {
  estado = VACIA;
  oyentes.forEach((fn) => fn());
}

/**
 * Quién le dice a la ventana «vuelve a corregir».
 *
 * El Backstage lo recibe en `avisar` y lo deja apuntado aquí, porque quien
 * exporta es un cuadro que puede estar tres componentes más abajo. Es la misma
 * pieza que `fijarVista` en el escritorio de Word y por el mismo motivo:
 * exportar no cambia el documento, así que el maestro no se enteraría solo.
 */
export function fijarAviso(fn: () => void) {
  avisar = fn;
}

export function avisarAlMaestro() {
  avisar?.();
}

/* ── las cifras, todas derivadas del mazo ─────────────────────────────────── */

/**
 * Cuánto pesa una diapositiva, en kilobytes.
 *
 * Es una estimación y no un cálculo real —no hay archivo—, pero **se deriva de
 * lo que la diapositiva lleva dentro** y no de un número escrito: el texto pesa
 * poco, una imagen pesa, un audio pesa más y un video mucho más. Así, la
 * columna «peso» del comparador de §43.7 dice la verdad sobre ESTA
 * presentación, que es lo único que la hace enseñable.
 */
const PESO = { base: 18, imagen: 120, audio: 240, video: 900 } as const;

function kbDelMazo(m: Mazo, formato: FormatoSalida): number {
  const contenido = m.diapositivas.reduce((kb, d) => {
    const libres = d.libres.reduce(
      (n, l) =>
        n +
        (l.clase === 'imagen' ? PESO.imagen : l.clase === 'audio' ? PESO.audio : l.clase === 'video' ? PESO.video : 0),
      0,
    );
    return kb + PESO.base + libres;
  }, 0);
  /*
   * El PDF pierde el sonido y el video —eso es la lección de §43.7— así que
   * pesa menos que el `.pptx`. El video, al revés: cada segundo de imagen en
   * movimiento pesa, y por eso sale un orden de magnitud por encima. Los dos
   * factores son groseros a propósito; lo que tiene que ser cierto es **el
   * orden**, no la cifra.
   */
  if (formato === 'pdf') return Math.round(contenido * 0.45);
  if (formato === 'video') return Math.round(contenido * 1.2 + segundosDelMazo(m) * 180);
  return contenido;
}

/**
 * Cuánto dura el video: la suma de los intervalos del mazo.
 *
 * Sin intervalos ensayados, cinco segundos por diapositiva, que es lo que
 * propone PowerPoint. Con ellos, lo que duró el ensayo — que es por lo que
 * `of-ppt-video-e-intervalos` va antes que ésta en el orden de §43.8.
 */
export function segundosDelMazo(m: Mazo): number {
  return m.diapositivas.reduce((s, d) => s + (d.intervalo ?? 5), 0);
}

/** Cuántas animaciones hay en todo el mazo. Es lo que el PDF pierde. */
export const cuantasAnimaciones = (m: Mazo): number =>
  m.diapositivas.reduce((n, d) => n + animaciones(d).length, 0);

/** Cuántos audios y videos hay. Es lo otro que el PDF pierde. */
export const cuantosMultimedia = (m: Mazo): number =>
  m.diapositivas.reduce(
    (n, d) => n + d.libres.filter((l) => l.clase === 'audio' || l.clase === 'video').length,
    0,
  );

/* ── exportar ─────────────────────────────────────────────────────────────── */

/** `hh:mm` de ahora. La hora la pone quien exporta; el modelo no tiene reloj. */
const ahora = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** El nombre sin extensión, como lo enseñaría Windows. */
export const sinExtension = (archivo: string): string => archivo.replace(/\.[a-z0-9]+$/i, '');

export const EXTENSION: Record<FormatoSalida, string> = { pdf: 'pdf', video: 'mp4', pptx: 'pptx' };

export const NOMBRE_FORMATO: Record<FormatoSalida, string> = {
  pdf: 'Documento PDF',
  video: 'Video MP4',
  pptx: 'Presentación de PowerPoint',
};

export function exportar(m: Mazo, archivo: string, formato: FormatoSalida): ArchivoSalido {
  const salido: ArchivoSalido = {
    nombre: sinExtension(archivo),
    formato,
    kb: kbDelMazo(m, formato),
    hora: ahora(),
    ...(formato === 'pdf' ? { paginas: m.diapositivas.length } : {}),
    ...(formato === 'video' ? { segundos: segundosDelMazo(m) } : {}),
  };
  /*
   * Exportar dos veces el mismo formato PISA el archivo anterior, como haría
   * cualquier programa al guardar con el mismo nombre en el mismo sitio. Sin
   * esto, un alumno que exporta tres veces cree que tiene tres archivos.
   */
  cambiar({ archivos: [...estado.archivos.filter((a) => a.formato !== formato), salido] });
  avisarAlMaestro();
  return salido;
}

export const hayEn = (formato: FormatoSalida): boolean =>
  estado.archivos.some((a) => a.formato === formato);

export const archivoDe = (formato: FormatoSalida): ArchivoSalido | undefined =>
  estado.archivos.find((a) => a.formato === formato);

export function proteger(parche: { soloLectura?: boolean; conContrasena?: boolean }) {
  cambiar(parche);
  avisarAlMaestro();
}

/** El tamaño escrito como lo escribe un explorador de archivos. */
export function comoPeso(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

/** `m:ss`, que es como se lee la duración de un video. */
export function comoTiempo(segundos: number): string {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
}
