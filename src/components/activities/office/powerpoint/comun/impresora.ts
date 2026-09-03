'use client';

import type { Mazo } from '@/components/office/motor-diapos/mazo';
import { cuantasHojas, type QueImprimir } from '@/components/office/motor-diapos/impresion';
import { avisarAlMaestro } from './salida';

/**
 * La **bandeja de la impresora** de la sala de PowerPoint (§44.4).
 *
 * Hermana de `salida.ts` y por los mismos motivos: los ajustes de impresión y lo
 * ya impreso **no están en el mazo** —imprimir no cambia la presentación— y el
 * guion es una constante de módulo que tiene que poder preguntar «¿ya sacó el
 * documento de seis?». Almacén fuera de React, `useSyncExternalStore` para
 * pintarlo, y el maestro lee exactamente lo mismo que la pantalla.
 *
 * ── POR QUÉ LOS ENCARGOS SE CIERRAN IMPRIMIENDO Y NO ELIGIENDO ──────────────
 *
 * Porque los ajustes son **un estado momentáneo** y la clase pide cuatro cosas
 * distintas: seis por hoja, tres por hoja, las notas, y en grises. Si cada
 * encargo mirase el desplegable, el tercero desharía al segundo y el alumno
 * volvería atrás sin haber hecho nada mal — el defecto que §44.2 pagó y que
 * §43.3 B ya había escrito. Lo impreso, en cambio, **sólo se acumula**: una hoja
 * que salió de la impresora no se des-imprime.
 *
 * Y de paso la lección sale mejor: elegir en un desplegable no es entregar.
 * Entregar es imprimir.
 *
 * ── NO SE IMPRIME NADA, Y SE DICE ───────────────────────────────────────────
 *
 * No se llama a `window.print()` ni se abre el diálogo del navegador. Lo dice el
 * propio cuadro, igual que el de Word. Lo que sí es cierto es **el número de
 * hojas**, que sale de paginar la presentación de verdad.
 */

export type TintaImpresa = 'color' | 'grises';

export interface Ajustes {
  que: QueImprimir;
  color: TintaImpresa;
  copias: number;
}

export interface TrabajoImpreso {
  que: QueImprimir;
  color: TintaImpresa;
  /** Hojas por copia. Derivado del mazo al imprimir, nunca escrito. */
  hojas: number;
  copias: number;
  hora: string;
}

export interface Impresora {
  ajustes: Ajustes;
  trabajos: TrabajoImpreso[];
}

/**
 * Con qué llega el cuadro la primera vez.
 *
 * «Diapositivas a página completa» y en color, que es lo que trae PowerPoint. Y
 * es lo correcto para esta clase: si llegara ya en documento de seis, el primer
 * encargo estaría hecho antes de empezar y la lección —que lo de la pantalla y
 * lo del papel no son lo mismo— no tendría dónde ocurrir.
 */
const DE_FABRICA: Impresora = {
  ajustes: { que: 'diapositivas', color: 'color', copias: 1 },
  trabajos: [],
};

let estado: Impresora = DE_FABRICA;
const oyentes = new Set<() => void>();

export function suscribirImpresora(fn: () => void): () => void {
  oyentes.add(fn);
  return () => {
    oyentes.delete(fn);
  };
}

export const leerImpresora = (): Impresora => estado;

function cambiar(parche: Partial<Impresora>) {
  estado = { ...estado, ...parche };
  oyentes.forEach((fn) => fn());
}

export function reiniciarImpresora() {
  estado = DE_FABRICA;
  oyentes.forEach((fn) => fn());
}

/**
 * Cambiar un ajuste **avisa al maestro** aunque no cierre ningún encargo.
 *
 * Sin esto, elegir «documento de 6» no llegaría a `evaluar` y el previo se
 * actualizaría en silencio; con esto, el maestro vuelve a leer y el alumno que
 * ya tenía el encargo hecho lo ve palomeado en cuanto imprime. Es la misma
 * puerta que usa `proteger`.
 */
export function ajustar(parche: Partial<Ajustes>) {
  cambiar({ ajustes: { ...estado.ajustes, ...parche } });
  avisarAlMaestro();
}

const ahora = (): string => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function imprimir(m: Mazo): TrabajoImpreso {
  const { que, color, copias } = estado.ajustes;
  const trabajo: TrabajoImpreso = { que, color, copias, hojas: cuantasHojas(m, que), hora: ahora() };
  /*
   * Los trabajos se ACUMULAN, al revés que los archivos exportados, que se
   * pisan. Y es la diferencia de verdad entre las dos bandejas: exportar dos
   * veces al mismo sitio deja un archivo, imprimir dos veces deja dos montones
   * de papel encima de la impresora.
   */
  cambiar({ trabajos: [...estado.trabajos, trabajo] });
  avisarAlMaestro();
  return trabajo;
}

/* ── lo que el guion pregunta ─────────────────────────────────────────────── */

export const seImprimio = (que: QueImprimir): boolean =>
  estado.trabajos.some((t) => t.que === que);

export const seImprimioEnGrises = (): boolean =>
  estado.trabajos.some((t) => t.color === 'grises');

export const hojasGastadas = (): number =>
  estado.trabajos.reduce((n, t) => n + t.hojas * t.copias, 0);
