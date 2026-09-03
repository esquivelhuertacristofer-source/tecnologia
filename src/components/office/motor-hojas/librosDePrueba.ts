/**
 * Tecnia Hojas · los libros con los que se mide.
 *
 * Viven en el motor y no en el banco a propósito, por la misma razón por la que
 * `verificar.ts` es el de producción: el banco y las pruebas de jest tienen que
 * medir **el mismo libro**, o el día que una de las dos falle nadie sabrá si
 * falló el motor o el dato (§36.5, y §39.4 A, donde el dato de prueba estaba
 * mal y el instrumento tenía razón).
 *
 * `libroDePrueba()` es una hoja de gastos escolares como la de la clase 1 del
 * grado Básico: datos, fórmulas encadenadas, una hoja que mira a otra y un
 * rango con nombre. Tiene que dar **0 · 0 · 0 · 0 · 0**.
 *
 * `libroRoto()` es el mismo con tres averías puestas a mano, y existe para
 * comprobar que **el verificador no miente en la otra dirección**: un
 * instrumento que nunca se dispara mide tan poco como uno que se dispara solo.
 */

import { type Celda, type Libro } from './modelo';

function hoja(id: string, nombre: string, filas: Record<string, string | Celda>) {
  const celdas: Record<string, Celda> = {};
  for (const [d, v] of Object.entries(filas)) celdas[d] = typeof v === 'string' ? { crudo: v } : v;
  return { id, nombre, celdas };
}

/** La hoja de gastos. 26 celdas escritas, 12 de ellas fórmulas. */
export function libroDePrueba(): Libro {
  return {
    activa: 'h1',
    nombres: { Precios: 'Gastos!B2:B6' },
    hojas: [
      hoja('h1', 'Gastos', {
        A1: 'Producto',
        B1: 'Precio',
        C1: 'Cantidad',
        D1: 'Importe',

        A2: 'Cuaderno',
        B2: '25',
        C2: '3',
        D2: '=B2*C2',

        A3: 'Lápiz',
        B3: '8.5',
        C3: '12',
        D3: '=B3*C3',

        A4: 'Mochila',
        B4: '450',
        C4: '1',
        D4: '=B4*C4',

        A5: 'Regla',
        B5: '15',
        C5: '2',
        D5: '=B5*C5',

        A6: 'Goma',
        B6: '6',
        C6: '4',
        D6: '=B6*C6',

        A8: 'Total',
        D8: '=SUMA(D2:D6)',
        A9: 'Promedio',
        D9: '=PROMEDIO(D2:D6)',
        A10: 'El más caro',
        D10: '=MAX(D2:D6)',
        A11: 'Con precio',
        D11: '=CONTAR(B2:B6)',
        A12: 'Con nombre',
        D12: '=CONTARA(A2:A6)',
        A13: '¿Pasa de 500?',
        D13: '=SI(D8>500,"sí","no")',
        A14: 'IVA',
        D14: { crudo: '=D8*0.16', formato: { tipo: 'moneda', decimales: 2 } },
        A15: 'Con IVA',
        D15: { crudo: '=D8+D14', formato: { tipo: 'moneda', decimales: 2 } },
        A16: 'Suma de precios',
        D16: '=SUMA(Precios)',
      }),
      hoja('h2', 'Resumen', {
        A1: 'Total de gastos',
        B1: '=Gastos!D8',
        A2: 'La mitad',
        B2: '=B1/2',
      }),
    ],
  };
}

/**
 * El mismo, roto a mano. Tres averías, cada una de una familia distinta:
 *
 * - `D18` lleva una fórmula que no se puede leer   → 1 ilegible (y el error que
 *   esa celda enseña, que también cuenta abajo).
 * - `D19` se refiere a sí misma                    → 1 circular.
 * - `D20` divide entre una celda vacía             → 1 error más.
 *
 * Cifras esperadas: **1 · 0 · 0 · 1 · 2**. La segunda y la tercera no se pueden
 * provocar rompiendo el dato —son defectos del motor, no del libro— y por eso
 * el banco tiene dos botones que las disparan a mano.
 */
export function libroRoto(): Libro {
  const base = libroDePrueba();
  const h = base.hojas[0];
  return {
    ...base,
    hojas: [
      {
        ...h,
        celdas: {
          ...h.celdas,
          A18: { crudo: 'Mal escrita' },
          D18: { crudo: '=SUMA(D2:D6' },
          A19: { crudo: 'Se muerde la cola' },
          D19: { crudo: '=D19+1' },
          A20: { crudo: 'Entre nada' },
          D20: { crudo: '=D8/D21' },
        },
      },
      ...base.hojas.slice(1),
    ],
  };
}

/**
 * Un libro grande, para medir de verdad.
 *
 * `filas` líneas de tres columnas con su importe, más una cadena de totales
 * parciales de `cadena` eslabones — cada uno mirando al anterior— para que el
 * grafo tenga profundidad y no sólo anchura. Un grafo ancho y plano se recalcula
 * rápido por accidente; lo que cuesta es una cadena larga, que es justo lo que
 * hay en una hoja de verdad con subtotales encadenados.
 */
export function libroGrande(filas = 1000, cadena = 500): Libro {
  const celdas: Record<string, Celda> = {};
  for (let i = 0; i < filas; i += 1) {
    const f = i + 1;
    celdas[`A${f}`] = { crudo: String((i % 97) + 1) };
    celdas[`B${f}`] = { crudo: String((i % 13) + 1) };
    celdas[`C${f}`] = { crudo: `=A${f}*B${f}` };
  }
  celdas[`E1`] = { crudo: `=SUMA(C1:C${filas})` };
  for (let i = 2; i <= cadena; i += 1) celdas[`E${i}`] = { crudo: `=E${i - 1}+A${(i % filas) + 1}` };
  return { activa: 'h1', nombres: {}, hojas: [{ id: 'h1', nombre: 'Grande', celdas }] };
}

/** El caso del criterio 2 del §45.5, en su forma más pura. */
export function libroCircular(): Libro {
  return {
    activa: 'h1',
    nombres: {},
    hojas: [hoja('h1', 'Hoja1', { A1: '=B1', B1: '=A1', C1: '=A1+1', D1: '10' })],
  };
}
