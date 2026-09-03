'use client';

import { useState } from 'react';
import type { PanelDeClaseProps } from '@/components/office/VentanaHojas';
import { cajaDeTexto } from '@/components/office/motor-hojas/comandos';
import { valorDe } from '@/components/office/motor-hojas/consultas';
import { aTexto, dir, letraDeColumna, type Tabla } from '@/components/office/motor-hojas/modelo';
import { ESTILOS_DE_TABLA, NOMBRES_DE_RESUMEN } from '@/components/office/motor-hojas/TablaVisual';
import './panelTablas.css';

/**
 * El panel de `of-excel-tablas-y-filtros`: ocho de los nueve botones de la
 * tabla (bloques 33-36; `inmovilizar` tiene su domicilio de siempre en Vista
 * → Mostrar y no está aquí). Es el mismo molde que `PanelReglas.tsx`
 * (`n7-formato-condicional`): entra por `panelFijo` y llama al MISMO
 * `gesto(control, valor)` que llamaría un botón de la cinta, así que cada
 * botón de aquí pasa por `revisar`, por la grabadora y por el corte del modo
 * guía como cualquier otro.
 *
 * El `valor` que arma cada botón está descrito, control por control, en
 * `controles.ts` — que es quien lo vuelve a leer.
 */

const COLUMNAS_TABLA = (t: Tabla) => {
  const c = cajaDeTexto(t.rango);
  if (!c) return [];
  return Array.from({ length: c.c1 - c.c0 + 1 }, (_, i) => c.c0 + i);
};

/** La tabla de esta hoja que contiene la celda activa. Ninguna si no hay. */
function tablaActiva(libro: PanelDeClaseProps['libro'], hoja: string, sel: PanelDeClaseProps['sel']): Tabla | null {
  const tablas = libro.hojas.find((h) => h.id === hoja)?.tablas ?? [];
  return (
    tablas.find((t) => {
      const c = cajaDeTexto(t.rango);
      return !!c && sel.c0 >= c.c0 && sel.c0 <= c.c1 && sel.f0 >= c.f0 && sel.f0 <= c.f1;
    }) ?? null
  );
}

/**
 * Los valores distintos de una columna, en el orden en que aparecen. Función
 * suelta y no `useMemo`: el React Compiler no podía preservar la memoización
 * manual porque `tabla` —`tablaActiva()`, arriba— es un objeto nuevo en cada
 * render, igual que ya es `columnas` dos líneas más abajo sin memoización
 * ninguna. Cuarenta filas como mucho: recorrerla de nuevo en cada pintado
 * sale más barato que pelear con esa memoización.
 */
function valoresDeColumna(tabla: Tabla | null, colFiltro: string, motor: PanelDeClaseProps['motor'], hoja: string): string[] {
  if (!tabla || colFiltro === '') return [];
  const c = cajaDeTexto(tabla.rango);
  if (!c) return [];
  const col = Number(colFiltro);
  const vistos = new Set<string>();
  const fuera: string[] = [];
  for (let f = c.f0 + 1; f <= c.f1; f += 1) {
    const t = aTexto(valorDe(motor, hoja, dir(col, f)));
    if (!vistos.has(t)) {
      vistos.add(t);
      fuera.push(t);
    }
  }
  return fuera;
}

type ModoFiltro = 'valores' | 'cmp';
type Op = 'mayor' | 'menor' | 'igual' | 'entre' | 'contiene';

export function PanelTablas({ libro, motor, hoja, sel, gesto }: PanelDeClaseProps) {
  const [nombreTabla, setNombreTabla] = useState('Pagos');
  const [colTotales, setColTotales] = useState('');
  const [resumen, setResumen] = useState('suma');
  const [colFiltro, setColFiltro] = useState('');
  const [modoFiltro, setModoFiltro] = useState<ModoFiltro>('valores');
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [op, setOp] = useState<Op>('mayor');
  const [contra1, setContra1] = useState('');
  const [contra2, setContra2] = useState('');
  const [orden1Col, setOrden1Col] = useState('');
  const [orden1Desc, setOrden1Desc] = useState(false);
  const [orden2Col, setOrden2Col] = useState('');
  const [orden2Desc, setOrden2Desc] = useState(false);

  const tabla = tablaActiva(libro, hoja, sel);
  const columnas = tabla ? COLUMNAS_TABLA(tabla) : [];

  const nombreDeColumna = (col: number): string => {
    if (!tabla) return letraDeColumna(col);
    const c = cajaDeTexto(tabla.rango);
    const titulo = c ? aTexto(valorDe(motor, hoja, dir(col, c.f0))) : '';
    return titulo ? `${letraDeColumna(col)} — ${titulo}` : letraDeColumna(col);
  };

  const valoresDeLaColumna = valoresDeColumna(tabla, colFiltro, motor, hoja);

  const crearTabla = () => {
    if (!nombreTabla.trim()) return;
    gesto('crear-tabla', nombreTabla.trim());
  };

  const aplicarTotales = () => {
    if (colTotales === '') return;
    gesto('fila-totales', `${colTotales}:${resumen}`);
  };

  const alternarValor = (v: string) => {
    setMarcados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(v)) nuevo.delete(v);
      else nuevo.add(v);
      return nuevo;
    });
  };

  const aplicarFiltro = () => {
    if (colFiltro === '') return;
    if (modoFiltro === 'valores') {
      const elegidos = valoresDeLaColumna.filter((v) => marcados.has(v));
      if (!elegidos.length) return;
      gesto('filtrar', `${colFiltro}|valores|${elegidos.join(',')}`);
      return;
    }
    if (op === 'entre') {
      if (!contra1 || !contra2) return;
      gesto('filtrar', `${colFiltro}|cmp|entre|${contra1}|${contra2}`);
      return;
    }
    if (!contra1) return;
    gesto('filtrar', `${colFiltro}|cmp|${op}|${contra1}`);
  };

  const ordenarVarias = () => {
    const niveles: string[] = [];
    if (orden1Col !== '') niveles.push(`${orden1Col}-${orden1Desc ? 1 : 0}`);
    if (orden2Col !== '' && orden2Col !== orden1Col) niveles.push(`${orden2Col}-${orden2Desc ? 1 : 0}`);
    if (!niveles.length) return;
    gesto('ordenar-varias', niveles.join(','));
  };

  return (
    <div className="ptb">
      <p className="ptb-sel">
        Selección actual: <b>{dir(sel.c0, sel.f0)}</b>
        {tabla ? (
          <>
            {' '}
            · dentro de la tabla «<b>{tabla.nombre}</b>»
          </>
        ) : (
          ' · fuera de cualquier tabla'
        )}
      </p>

      <section className="ptb-seccion">
        <h4>Crear tabla</h4>
        <p className="ptb-ayuda">Marca el rango —con encabezado incluido— y pulsa Crear.</p>
        <div className="ptb-fila">
          <input
            aria-label="Nombre de la tabla"
            type="text"
            value={nombreTabla}
            placeholder="Nombre de la tabla"
            onChange={(e) => setNombreTabla(e.target.value)}
          />
          <button type="button" data-control="crear-tabla" onClick={crearTabla}>
            Crear tabla
          </button>
        </div>
      </section>

      <section className="ptb-seccion">
        <h4>Estilo de tabla</h4>
        <p className="ptb-ayuda">Ponte en una celda de la tabla y elige un color.</p>
        <div className="ptb-fila ptb-estilos">
          {Object.entries(ESTILOS_DE_TABLA).map(([id, e]) => (
            <button
              key={id}
              type="button"
              data-control="estilo-tabla"
              data-estilo={id}
              className="ptb-estilo"
              title={e.nombre}
              aria-label={e.nombre}
              style={{ background: e.cabecera }}
              onClick={() => gesto('estilo-tabla', id)}
            />
          ))}
        </div>
      </section>

      <section className="ptb-seccion">
        <h4>Fila de totales</h4>
        <p className="ptb-ayuda">Elige la columna y qué resumen enseñar debajo de la tabla.</p>
        <div className="ptb-fila">
          <select aria-label="Columna de totales" value={colTotales} onChange={(e) => setColTotales(e.target.value)}>
            <option value="">Columna…</option>
            {columnas.map((c) => (
              <option key={c} value={c}>
                {nombreDeColumna(c)}
              </option>
            ))}
          </select>
          <select aria-label="Resumen" value={resumen} onChange={(e) => setResumen(e.target.value)}>
            {Object.entries(NOMBRES_DE_RESUMEN).map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
          <button type="button" data-control="fila-totales" onClick={aplicarTotales}>
            Aplicar
          </button>
        </div>
      </section>

      <section className="ptb-seccion">
        <h4>Filtrar</h4>
        <p className="ptb-ayuda">Elige la columna, cómo filtrar, y pulsa Filtrar. Las filas que no cumplan se esconden — no se borran.</p>
        <div className="ptb-fila">
          <select
            aria-label="Columna a filtrar"
            value={colFiltro}
            onChange={(e) => {
              setColFiltro(e.target.value);
              setMarcados(new Set());
            }}
          >
            <option value="">Columna…</option>
            {columnas.map((c) => (
              <option key={c} value={c}>
                {nombreDeColumna(c)}
              </option>
            ))}
          </select>
          <select aria-label="Modo de filtro" value={modoFiltro} onChange={(e) => setModoFiltro(e.target.value as ModoFiltro)}>
            <option value="valores">Marcar valores</option>
            <option value="cmp">Comparar</option>
          </select>
        </div>
        {colFiltro !== '' && modoFiltro === 'valores' && (
          <ul className="ptb-valores">
            {valoresDeLaColumna.map((v) => (
              <li key={v}>
                <label>
                  <input type="checkbox" checked={marcados.has(v)} onChange={() => alternarValor(v)} />
                  {v || '(vacío)'}
                </label>
              </li>
            ))}
          </ul>
        )}
        {colFiltro !== '' && modoFiltro === 'cmp' && (
          <div className="ptb-fila">
            <select aria-label="Comparación" value={op} onChange={(e) => setOp(e.target.value as Op)}>
              <option value="mayor">Mayor que…</option>
              <option value="menor">Menor que…</option>
              <option value="igual">Igual a…</option>
              <option value="entre">Entre…</option>
              <option value="contiene">Que contenga texto…</option>
            </select>
            <input
              aria-label={op === 'contiene' ? 'Texto' : 'Número'}
              type={op === 'contiene' ? 'text' : 'number'}
              value={contra1}
              onChange={(e) => setContra1(e.target.value)}
            />
            {op === 'entre' && (
              <input aria-label="Hasta" type="number" value={contra2} onChange={(e) => setContra2(e.target.value)} />
            )}
          </div>
        )}
        <div className="ptb-fila">
          <button type="button" data-control="filtrar" onClick={aplicarFiltro} disabled={colFiltro === ''}>
            Filtrar
          </button>
          <button type="button" data-control="quitar-filtros" onClick={() => gesto('quitar-filtros')}>
            Quitar filtros
          </button>
        </div>
      </section>

      <section className="ptb-seccion">
        <h4>Ordenar por varias columnas</h4>
        <p className="ptb-ayuda">Primero se agrupa por el primer nivel; dentro de cada grupo, se ordena por el segundo.</p>
        <div className="ptb-fila">
          <select aria-label="Primer nivel: columna" value={orden1Col} onChange={(e) => setOrden1Col(e.target.value)}>
            <option value="">1.º nivel…</option>
            {columnas.map((c) => (
              <option key={c} value={c}>
                {nombreDeColumna(c)}
              </option>
            ))}
          </select>
          <select
            aria-label="Primer nivel: sentido"
            value={orden1Desc ? '1' : '0'}
            onChange={(e) => setOrden1Desc(e.target.value === '1')}
          >
            <option value="0">A → Z</option>
            <option value="1">Z → A</option>
          </select>
        </div>
        <div className="ptb-fila">
          <select aria-label="Segundo nivel: columna" value={orden2Col} onChange={(e) => setOrden2Col(e.target.value)}>
            <option value="">2.º nivel…</option>
            {columnas.map((c) => (
              <option key={c} value={c}>
                {nombreDeColumna(c)}
              </option>
            ))}
          </select>
          <select
            aria-label="Segundo nivel: sentido"
            value={orden2Desc ? '1' : '0'}
            onChange={(e) => setOrden2Desc(e.target.value === '1')}
          >
            <option value="0">A → Z</option>
            <option value="1">Z → A</option>
          </select>
          <button type="button" data-control="ordenar-varias" onClick={ordenarVarias}>
            Ordenar
          </button>
        </div>
      </section>

      <section className="ptb-seccion">
        <h4>Filas escondidas a mano</h4>
        <p className="ptb-ayuda">Marca las filas por su cabecera y pulsa uno de los dos. No hace falta ninguna tabla.</p>
        <div className="ptb-fila">
          <button type="button" data-control="ocultar-filas" onClick={() => gesto('ocultar-filas')}>
            Ocultar filas
          </button>
          <button type="button" data-control="mostrar-filas" onClick={() => gesto('mostrar-filas')}>
            Mostrar filas
          </button>
        </div>
      </section>
    </div>
  );
}

export default PanelTablas;
