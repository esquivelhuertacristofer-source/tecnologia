'use client';

import { useState } from 'react';
import type { PanelDeClaseProps } from '@/components/office/VentanaHojas';
import { dir } from '@/components/office/motor-hojas/modelo';
import type { ReglaCondicional } from '@/components/office/motor-hojas/modelo';
import './panelReglas.css';

/**
 * El panel de `n7-formato-condicional`: el «Formato condicional» y el
 * «Insertar minigráfico» de Excel, en miniatura.
 *
 * ── POR QUÉ ES UN PANEL Y NO BOTONES DE LA CINTA ─────────────────────────────
 *
 * Los siete comandos que usa este panel —`regla-barras`, `regla-escala`,
 * `regla-iconos`, `regla-destacar`, `borrar-reglas`, `minigrafico`,
 * `borrar-minigraficos`— ya existían en `comandos.ts` y en `cinta.ts` antes de
 * esta clase, cableados y probados: son «motor ya cableado, listo para que la
 * clase que los enseñe lo llame por su id» (la cabecera de `cinta.ts`, junto a
 * `idDeRegla`). Lo que faltaba era el cuadro de diálogo que en Excel de verdad
 * pide la comparación, el número o el rango del que come un minigráfico —y ese
 * cuadro no vive en la cinta de ningún grado: `tecniaHojas.ts` declara, a
 * propósito, que el grado Básico no trae formato condicional, y ningún otro
 * archivo compartido tiene todavía una fila para esto.
 *
 * Así que este panel entra por `panelFijo` (§45.7, igual que la Hoja de
 * intervalos de PowerPoint) y llama al MISMO `gesto(control, valor)` que
 * llamaría un botón de la cinta: pasa por `pulsar` en `VentanaHojas.tsx`, por
 * lo tanto por `revisar`, por la grabadora de macros y por el corte del modo
 * guía. No hay una puerta trasera aquí: cada botón de este panel es, para el
 * resto de la ventana, exactamente un botón de la cinta más.
 *
 * ── EL FORMATO DE `valor`, QUE NO SE INVENTA AQUÍ ────────────────────────────
 *
 * `reglaDestacarControl` y `minigraficoControl` (`cinta.ts`) ya saben leer
 * `"mayor:1000"`, `"entre:100:500"`, `"contiene:texto"`, `"duplicados"` y
 * `"linea|B4:E4"` — ese formato lo fijó `cinta.ts` el día que se escribió el
 * comando, y este panel sólo lo arma con lo que el alumno teclea. Cambiarlo
 * aquí sin cambiarlo allá dejaría el botón mudo.
 */

const NOMBRE_DE_CLASE: Record<ReglaCondicional['clase'], string> = {
  barras: 'Barras de datos',
  escala: 'Escala de color',
  iconos: 'Conjunto de iconos',
  destacar: 'Destacar',
  formula: 'Fórmula',
};

type Comparacion = 'mayor' | 'menor' | 'entre' | 'contiene' | 'duplicados';
type TipoMinigrafico = 'linea' | 'columna' | 'ganancia';

const NOMBRE_DE_TIPO_MINI: Record<TipoMinigrafico, string> = {
  linea: 'Línea',
  columna: 'Columna',
  ganancia: 'Ganancia o pérdida',
};

/** `"E4"` para una celda sola, `"E4:E12"` para un rango. Igual que lo escribe Excel. */
function textoDeSeleccion(sel: PanelDeClaseProps['sel']): string {
  const a = dir(sel.c0, sel.f0);
  const b = dir(sel.c1, sel.f1);
  return a === b ? a : `${a}:${b}`;
}

export function PanelReglas({ libro, hoja, sel, gesto }: PanelDeClaseProps) {
  const [comparacion, setComparacion] = useState<Comparacion>('mayor');
  const [valor1, setValor1] = useState('');
  const [valor2, setValor2] = useState('');
  const [tipoMini, setTipoMini] = useState<TipoMinigrafico>('linea');
  const [rangoMini, setRangoMini] = useState('');

  const reglas = libro.hojas.find((h) => h.id === hoja)?.reglas ?? [];

  const aplicarDestacar = () => {
    const valor =
      comparacion === 'duplicados'
        ? 'duplicados'
        : comparacion === 'entre'
          ? `entre:${valor1}:${valor2}`
          : `${comparacion}:${valor1}`;
    gesto('regla-destacar', valor);
  };

  const insertarMinigrafico = () => {
    if (!rangoMini.trim()) return;
    gesto('minigrafico', `${tipoMini}|${rangoMini.trim()}`);
  };

  return (
    <div className="pfc">
      <p className="pfc-sel">
        Selección actual: <b>{textoDeSeleccion(sel)}</b>
      </p>

      <section className="pfc-seccion">
        <h4>Un solo color</h4>
        <p className="pfc-ayuda">Marca un rango de números y pulsa uno de los tres.</p>
        <div className="pfc-fila">
          <button type="button" data-control="regla-barras" onClick={() => gesto('regla-barras')}>
            ▥ Barras de datos
          </button>
          <button type="button" data-control="regla-escala" onClick={() => gesto('regla-escala')}>
            🎨 Escala de color
          </button>
          <button type="button" data-control="regla-iconos" onClick={() => gesto('regla-iconos')}>
            🚦 Conjunto de iconos
          </button>
        </div>
      </section>

      <section className="pfc-seccion">
        <h4>Destacar celdas</h4>
        <p className="pfc-ayuda">Marca un rango, elige con qué comparar y pulsa Aplicar.</p>
        <div className="pfc-fila">
          <select
            aria-label="Comparación"
            value={comparacion}
            onChange={(e) => setComparacion(e.target.value as Comparacion)}
          >
            <option value="mayor">Mayor que…</option>
            <option value="menor">Menor que…</option>
            <option value="entre">Entre…</option>
            <option value="contiene">Que contenga texto…</option>
            <option value="duplicados">Valores duplicados</option>
          </select>
          {comparacion !== 'duplicados' && (
            <input
              aria-label={comparacion === 'contiene' ? 'Texto' : 'Número'}
              type={comparacion === 'contiene' ? 'text' : 'number'}
              value={valor1}
              placeholder={comparacion === 'contiene' ? 'texto' : 'número'}
              onChange={(e) => setValor1(e.target.value)}
            />
          )}
          {comparacion === 'entre' && (
            <input
              aria-label="Hasta"
              type="number"
              value={valor2}
              placeholder="hasta"
              onChange={(e) => setValor2(e.target.value)}
            />
          )}
          <button type="button" data-control="regla-destacar" onClick={aplicarDestacar}>
            Aplicar
          </button>
        </div>
      </section>

      <section className="pfc-seccion">
        <h4>Reglas de esta hoja</h4>
        {reglas.length === 0 ? (
          <p className="pfc-vacio">Ninguna todavía.</p>
        ) : (
          <ul className="pfc-lista">
            {reglas.map((r) => (
              <li key={r.id}>
                <span>
                  {NOMBRE_DE_CLASE[r.clase]} · {r.rango}
                </span>
                <button
                  type="button"
                  data-control="borrar-reglas"
                  title={`Quitar «${NOMBRE_DE_CLASE[r.clase]} · ${r.rango}»`}
                  aria-label={`Quitar ${NOMBRE_DE_CLASE[r.clase]} en ${r.rango}`}
                  onClick={() => gesto('borrar-reglas', r.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pfc-seccion">
        <h4>Minigráfico en la celda seleccionada</h4>
        <p className="pfc-ayuda">Ponte en la celda destino, di el tipo y de dónde come, y pulsa Insertar.</p>
        <div className="pfc-fila">
          <select
            aria-label="Tipo de minigráfico"
            value={tipoMini}
            onChange={(e) => setTipoMini(e.target.value as TipoMinigrafico)}
          >
            {(Object.keys(NOMBRE_DE_TIPO_MINI) as TipoMinigrafico[]).map((t) => (
              <option key={t} value={t}>
                {NOMBRE_DE_TIPO_MINI[t]}
              </option>
            ))}
          </select>
          <input
            aria-label="Rango de datos"
            type="text"
            value={rangoMini}
            placeholder="p. ej. B4:E4"
            onChange={(e) => setRangoMini(e.target.value)}
          />
          <button type="button" data-control="minigrafico" onClick={insertarMinigrafico}>
            Insertar
          </button>
          <button type="button" data-control="borrar-minigraficos" onClick={() => gesto('borrar-minigraficos')}>
            Quitar
          </button>
        </div>
      </section>
    </div>
  );
}

export default PanelReglas;
