'use client';

/**
 * Tecnia Hojas · `TablaVisual.tsx` — lo que se ve de una tabla (bloques 33-36).
 *
 * `comandos.ts` lo deja escrito en la cabecera de su sección «la tabla»:
 * **ningún comando pinta nada por su cuenta**. Guardan el dato —`Tabla`,
 * `Hoja.visibles`— y lo que se ve —el color del estilo, el aro de un filtro
 * activo, la fila de totales— lo dibuja quien la enseñe, leyendo el libro,
 * igual que `Grafica.tsx` dibuja `Hoja.graficas`. Éste es ese archivo: la
 * primera clase que enseña tablas es quien lo escribe.
 *
 * ── DOS PIEZAS, DOS TÉCNICAS DISTINTAS ──────────────────────────────────────
 *
 * 1. **El estilo (color de cabecera y bandas)** no se pinta con un `div` por
 *    encima: `.hjw-celda` es OPACA (`background: #fff`, `ventanaHojas.css`),
 *    así que una capa por encima del texto lo taparía y una capa por debajo
 *    no se vería nunca. Se pinta por la puerta que ya existe para esto —
 *    `DecoracionCelda`, la misma que usa el formato condicional— y
 *    `decoracionesDeTablas()` la construye para que `VentanaHojas.tsx` la
 *    mezcle con la del formato condicional en el mismo repintado.
 * 2. **El marco de la tabla y la fila de totales** sí son capas propias,
 *    porque no tapan nada: el marco es un rectángulo con relleno
 *    `transparent` —sólo se ve el borde—, y la fila de totales vive en una
 *    fila que no existe en `Hoja.celdas`. Cuelgan del espacio de la hoja
 *    exactamente con la misma multiplicación que ya usan el tirador, la
 *    estela y las gráficas (`VentanaHojas.tsx`): celdas por su ancho, puesto
 *    por su alto. Ni una medida del DOM.
 *
 * ── POR QUÉ EL MARCO NO SE ROMPE CON UNA TABLA FILTRADA ─────────────────────
 *
 * Dentro de las filas de UNA tabla, las visibles quedan consecutivas en
 * PUESTOS de pantalla —esconder la fila 6 no deja un hueco en blanco, corre
 * la 7 hacia arriba (`Hoja.visibles`, `modelo.ts`)—, así que un solo
 * rectángulo del primer puesto al último basta: no hace falta un rectángulo
 * por fila. Lo que si hace falta es no perder de vista que el encabezado
 * **nunca** se esconde (`comandos.ts`, `recalcularVisibles`), así que su
 * puesto es siempre el techo del rectángulo.
 */

import { cajaDeTexto } from './comandos';
import type { DecoracionCelda } from './condicional';
import type { Motor } from './formula/calculo';
import {
  clave,
  hojaDe,
  puestoDeFila,
  textoDeNumero,
  type Clave,
  type Formato,
  type Hoja,
  type Libro,
  type Tabla,
} from './modelo';
import { totalDeColumna } from './consultas';

/** Los estilos de tabla que esta sala enseña: pocos y que se distingan entre sí. */
export const ESTILOS_DE_TABLA: Record<string, { nombre: string; cabecera: string; banda: string }> = {
  'claro-azul': { nombre: 'Azul', cabecera: '#1f5fb8', banda: '#e9f1fc' },
  'claro-verde': { nombre: 'Verde', cabecera: '#0f7b3e', banda: '#e7f6ed' },
  'claro-naranja': { nombre: 'Naranja', cabecera: '#c2560f', banda: '#fdece0' },
  'claro-morado': { nombre: 'Morado', cabecera: '#6b3fa0', banda: '#f0e9f8' },
  'claro-gris': { nombre: 'Gris', cabecera: '#4a4a4a', banda: '#eeeeee' },
};

export const NOMBRES_DE_RESUMEN: Record<string, string> = {
  suma: 'Suma',
  promedio: 'Promedio',
  cuenta: 'Cuenta',
  max: 'Máx',
  min: 'Mín',
  ninguno: '—',
};

const SIN_DECORACION: ReadonlyMap<Clave, DecoracionCelda> = new Map();

/**
 * El color de cabecera y las bandas de una tabla, en `DecoracionCelda` — la
 * misma estructura que ya mezcla `VentanaHojas.tsx` para el formato
 * condicional. Se mezcla con ella y no la sustituye (ver ese archivo).
 *
 * La cabecera lleva además el aro del filtro (bloque 34): un triángulo tenue
 * en toda columna de la tabla, y uno **encendido** en la que tiene un filtro
 * puesto ahora mismo — es «el aro de un filtro activo» que pide `comandos.ts`.
 */
export function decoracionesDeTablas(libro: Libro, hojaId: string): ReadonlyMap<Clave, DecoracionCelda> {
  const hoja = hojaDe(libro, hojaId);
  const tablas = hoja?.tablas;
  if (!hoja || !tablas || !tablas.length) return SIN_DECORACION;
  const out = new Map<Clave, DecoracionCelda>();
  for (const t of tablas) {
    const c = cajaDeTexto(t.rango);
    if (!c) continue;
    const paleta = ESTILOS_DE_TABLA[t.estilo] ?? ESTILOS_DE_TABLA['claro-azul'];
    for (let col = c.c0; col <= c.c1; col += 1) {
      const conFiltro = Boolean(t.filtros?.[col]);
      out.set(clave(hojaId, col, c.f0), {
        formato: { tipo: 'general', colorRelleno: paleta.cabecera, colorLetra: '#ffffff', negrita: true },
        icono: { simbolo: '▾', color: conFiltro ? '#ffd23f' : '#ffffffb0' },
      });
    }
    // Las bandas: sólo las filas VISIBLES entran en la cuenta de paridad, para
    // que esconder una fila no deje dos bandas del mismo color pegadas.
    let indice = 0;
    for (let f = c.f0 + 1; f <= c.f1; f += 1) {
      if (puestoDeFila(hoja, f) < 0) continue;
      if (indice % 2 === 1) {
        for (let col = c.c0; col <= c.c1; col += 1) {
          out.set(clave(hojaId, col, f), { formato: { tipo: 'general', colorRelleno: paleta.banda } });
        }
      }
      indice += 1;
    }
  }
  return out;
}

/**
 * Junta dos formatos opcionales sin perder de vista que `Formato.tipo` es
 * obligatorio: `{ ...a, ...b }` con `a`/`b` los dos `Formato | undefined`
 * infiere `tipo` como opcional —ninguno de los dos operandos lo garantiza por
 * sí solo—, aunque en el caso normal uno de los dos SÍ lo trae. Guardando
 * primero los casos donde falta uno entero, lo que queda por mezclar son dos
 * `Formato` de verdad, y ahí `tipo` sí se hereda con su tipo obligatorio.
 *
 * Defecto cazado el 16-ago-2026 construyendo `of-excel-consolida-y-protege`,
 * fuera de esa clase: no depende de nada del bloque 53 ni del 54.
 */
function mezclarFormato(a: Formato | undefined, b: Formato | undefined): Formato | undefined {
  if (!a) return b;
  if (!b) return a;
  return { ...a, ...b };
}

/**
 * `dTabla` es la base y `dCondicional` gana campo a campo: misma prioridad
 * que ya usa `VentanaHojas.tsx` entre el formato de la celda y el de una
 * regla condicional. Las dos cosas no van a chocar en esta sala —ninguna
 * clase de tablas trae formato condicional en el mismo libro—, pero la
 * prioridad queda escrita por si un día una clase junta las dos.
 */
export function combinarDecoraciones(
  dTabla: ReadonlyMap<Clave, DecoracionCelda>,
  dCondicional: ReadonlyMap<Clave, DecoracionCelda>,
): ReadonlyMap<Clave, DecoracionCelda> {
  if (!dTabla.size) return dCondicional;
  if (!dCondicional.size) return dTabla;
  const out = new Map<Clave, DecoracionCelda>(dTabla);
  for (const [k, v] of dCondicional) {
    const previa = out.get(k);
    out.set(k, previa ? { ...previa, ...v, formato: mezclarFormato(previa.formato, v.formato) } : v);
  }
  return out;
}

export interface TablaVisualProps {
  tabla: Tabla;
  hoja: Hoja;
  motor: Motor;
  anchoCol: number;
  altoFila: number;
  anchoCab: number;
  altoCab: number;
}

/**
 * El marco de la tabla y su fila de totales, si tiene. `null` si el rango no
 * se entiende —no debería pasar con un libro bien formado, pero un `#null`
 * silencioso es preferible a una ventana que truena por una tabla mal escrita.
 */
export function TablaVisual({ tabla, hoja, motor, anchoCol, altoFila, anchoCab, altoCab }: TablaVisualProps) {
  const c = cajaDeTexto(tabla.rango);
  if (!c) return null;
  const puestoCabecera = puestoDeFila(hoja, c.f0);
  if (puestoCabecera < 0) return null; // el encabezado nunca debería esconderse, pero por si acaso
  let puestoUltimo = puestoCabecera;
  for (let f = c.f0 + 1; f <= c.f1; f += 1) {
    const p = puestoDeFila(hoja, f);
    if (p >= 0) puestoUltimo = p;
  }
  const filas = puestoUltimo - puestoCabecera + 1;
  const columnas = c.c1 - c.c0 + 1;
  const resumenes = tabla.filaDeTotales ?? {};
  const hayTotales = Object.keys(resumenes).length > 0;
  const paleta = ESTILOS_DE_TABLA[tabla.estilo] ?? ESTILOS_DE_TABLA['claro-azul'];
  const left = anchoCab + c.c0 * anchoCol;
  const top = altoCab + puestoCabecera * altoFila;
  const ancho = columnas * anchoCol;

  return (
    <>
      {/* El marco: relleno transparente a propósito (ver la cabecera del
          archivo) — sólo el borde, para no tapar ni una celda de debajo. */}
      <div
        className="hjw-tabla-marco"
        aria-hidden="true"
        data-tabla-marco={tabla.id}
        style={{
          left,
          top,
          width: ancho,
          height: (filas + (hayTotales ? 1 : 0)) * altoFila,
          borderColor: paleta.cabecera,
        }}
      />
      {hayTotales && (
        <div
          className="hjw-tabla-totales"
          data-tabla-totales={tabla.id}
          style={{ left, top: top + filas * altoFila, width: ancho, height: altoFila }}
        >
          {Array.from({ length: columnas }, (_, i) => {
            const col = c.c0 + i;
            const resumen = resumenes[col];
            const valor = resumen && resumen !== 'ninguno' ? totalDeColumna(motor, hoja.id, tabla, col) : null;
            return (
              <div key={col} className="hjw-tabla-totales-celda" style={{ width: anchoCol }} data-tabla-total={`${tabla.id}-${col}`}>
                {typeof valor === 'number' ? textoDeNumero(valor) : ''}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default TablaVisual;
