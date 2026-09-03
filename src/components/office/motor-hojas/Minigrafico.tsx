/**
 * Tecnia Hojas · `Minigrafico.tsx` — un gráfico DENTRO de una celda (bloque
 * 31), dibujado a mano en SVG como ya hace `Grafica.tsx` — por el mismo
 * motivo del §45.5: una librería trae su propio eje, y aquí el eje es la
 * celda entera.
 *
 * ── ¿TAPA EL VALOR O CONVIVE? ────────────────────────────────────────────────
 *
 * **Tapa.** Un minigráfico se pinta encima de todo el rectángulo de su celda,
 * y lo que hubiera escrito ahí deja de verse mientras el minigráfico esté
 * puesto — es lo que hace Excel de verdad: el dibujo ocupa el fondo entero de
 * la celda y un número debajo sería ilegible a ese tamaño. Lo que **no**
 * cambia es el dato: `Celda.crudo` sigue intacto, se sigue leyendo en la barra
 * de fórmulas, y `CONTAR`/`SUMA` lo siguen viendo — sólo la pantalla, en esa
 * celda, decide dibujar el resumen en vez del número. Es la misma frase que
 * ya vale para `Formato`: nada de esto cambia lo que la celda vale.
 *
 * ── DE DÓNDE SALEN LOS NÚMEROS ──────────────────────────────────────────────
 *
 * De `valorDe(motor, …)`, igual que `Grafica.tsx`: `Minigrafico.datos` es un
 * domicilio (`"A1:F1"`), no un contenido, así que el dibujo se recalcula solo
 * cuando cambia una celda de la que come.
 */

import type { ReactNode } from 'react';
import { cajaDeTexto } from './comandos';
import { valorDe, type Motor } from './formula/calculo';
import { COL_PX, FILA_PX } from './Grafica';
import type { Minigrafico as ObjetoMinigrafico } from './modelo';

const AZUL = '#4472C4';
const VERDE = '#63BE7B';
const ROJO = '#F8696B';

/**
 * Los números del rango, en el orden en que se leen: fila por fila, columna
 * por columna dentro de cada fila. Un hueco —texto, vacío, error— es `null`
 * y NO es cero (decisión 3 de `modelo.ts`): un minigráfico de línea con un
 * hueco tiene que abrirse ahí, no caer al suelo.
 */
export function datosDeMinigrafico(motor: Motor, hoja: string, rango: string): Array<number | null> {
  const caja = cajaDeTexto(rango);
  if (!caja) return [];
  const puntos: Array<number | null> = [];
  for (let f = caja.f0; f <= caja.f1; f += 1) {
    for (let c = caja.c0; c <= caja.c1; c += 1) {
      const v = valorDe(motor, hoja, c, f);
      puntos.push(typeof v === 'number' && Number.isFinite(v) ? v : null);
    }
  }
  return puntos;
}

/**
 * Mínimo y máximo SIN anclar en cero — a propósito, y al revés que
 * `escalaDe` de `Grafica.tsx`—: una línea de `[98, 99, 101, 100]` tiene que
 * enseñar la forma de esos cuatro números, y forzando el cero adentro saldría
 * una raya plana pegada arriba. Es la misma cuenta que usan las gráficas de
 * dispersión de Excel para su eje X, con la misma guarda para cuando todos
 * los números son iguales.
 */
function rangoBruto(numeros: number[]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const n of numeros) {
    if (n < min) min = n;
    if (n > max) max = n;
  }
  if (max <= min) return { min: min - 1, max: min + 1 };
  return { min, max };
}

export interface MinigraficoProps {
  minigrafico: ObjetoMinigrafico;
  motor: Motor;
  /** La hoja de la que come. Hoy siempre la suya, igual que en `Grafica.tsx`. */
  hoja: string;
}

/** Nada de aquí lanza: un rango vacío o de puro texto dibuja un lienzo en blanco. */
export default function Minigrafico({ minigrafico, motor, hoja }: MinigraficoProps) {
  const puntos = datosDeMinigrafico(motor, hoja, minigrafico.datos);
  const w = COL_PX;
  const h = FILA_PX;
  const numeros = puntos.filter((p): p is number => p !== null);

  const lienzo = (contenido: ReactNode, titulo: string) => (
    <svg
      className="hjw-minigrafico-svg"
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={titulo}
      data-tipo={minigrafico.tipo}
    >
      <title>{titulo}</title>
      {contenido}
    </svg>
  );

  if (numeros.length === 0) {
    return lienzo(null, `Minigráfico de ${minigrafico.tipo}: no hay ningún número en ${minigrafico.datos}`);
  }

  const pad = 1.5;
  const x0 = pad;
  const x1 = w - pad;
  const y0 = pad;
  const y1 = h - pad;
  const n = puntos.length;
  const anchoPunto = (x1 - x0) / Math.max(1, n);

  if (minigrafico.tipo === 'ganancia') {
    // Gana/pierde: sólo el SIGNO importa, todas las barras miden lo mismo.
    // Es la lectura de un marcador, no de una medida — el bloque 31 lo pide
    // así porque es el tercer tipo que trae Excel y el único que no escala.
    const medio = (y0 + y1) / 2;
    const alto = (y1 - y0) / 2 - 1;
    return lienzo(
      <g data-serie="ganancia">
        {puntos.map((v, i) => {
          if (v === null || v === 0) return null;
          const x = x0 + i * anchoPunto + anchoPunto * 0.12;
          const ancho = Math.max(1, anchoPunto * 0.76);
          return v > 0 ? (
            <rect key={i} data-barra={i} x={x} y={medio - alto} width={ancho} height={alto} fill={VERDE} />
          ) : (
            <rect key={i} data-barra={i} x={x} y={medio} width={ancho} height={alto} fill={ROJO} />
          );
        })}
        <line x1={x0} y1={medio} x2={x1} y2={medio} stroke="#c9ced6" strokeWidth={0.6} />
      </g>,
      `Minigráfico de ganancia y pérdida de ${minigrafico.datos}`,
    );
  }

  if (minigrafico.tipo === 'columna') {
    // La columna SÍ se ancla en cero, como una barra de datos: aquí lo que
    // importa es la magnitud de cada punto, no sólo su forma.
    const { min, max } = ((): { min: number; max: number } => {
      const conCero = Math.min(0, ...numeros);
      const tope = Math.max(0, ...numeros);
      return tope > conCero ? { min: conCero, max: tope } : { min: conCero - 1, max: tope + 1 };
    })();
    const cero = y1 - ((0 - min) / (max - min)) * (y1 - y0);
    return lienzo(
      <g data-serie="columna">
        {puntos.map((v, i) => {
          if (v === null) return null;
          const x = x0 + i * anchoPunto + anchoPunto * 0.12;
          const ancho = Math.max(1, anchoPunto * 0.76);
          const y = y1 - ((v - min) / (max - min)) * (y1 - y0);
          const arriba = Math.min(y, cero);
          const alto = Math.max(0.6, Math.abs(y - cero));
          return <rect key={i} data-barra={i} x={x} y={arriba} width={ancho} height={alto} fill={v < 0 ? ROJO : AZUL} />;
        })}
      </g>,
      `Minigráfico de columnas de ${minigrafico.datos}`,
    );
  }

  // 'linea': con los huecos abiertos, igual que `Lineas` en `Grafica.tsx`.
  const { min, max } = rangoBruto(numeros);
  const enY = (v: number) => y1 - ((v - min) / (max - min)) * (y1 - y0);
  const enX = (i: number) => (n > 1 ? x0 + i * ((x1 - x0) / (n - 1)) : (x0 + x1) / 2);
  const tramos: string[] = [];
  let abierto = false;
  puntos.forEach((v, i) => {
    if (v === null) {
      abierto = false;
      return;
    }
    tramos.push(`${abierto ? 'L' : 'M'}${enX(i)} ${enY(v)}`);
    abierto = true;
  });
  const ultimo = numeros[numeros.length - 1];
  return lienzo(
    <g data-serie="linea">
      <path d={tramos.join(' ')} stroke={AZUL} strokeWidth={1.1} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <circle data-punto="ultimo" cx={enX(n - 1)} cy={enY(ultimo)} r={1.4} fill={AZUL} />
    </g>,
    `Minigráfico de línea de ${minigrafico.datos}`,
  );
}
