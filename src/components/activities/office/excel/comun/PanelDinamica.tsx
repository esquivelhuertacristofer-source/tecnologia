'use client';

import { useState } from 'react';
import type { PanelDeClaseProps } from '@/components/office/VentanaHojas';
import { textoDeCaja } from '@/components/office/motor-hojas/comandos';
import { dinamicaPintada, partirOrigen } from '@/components/office/motor-hojas/dinamica';
import { NOMBRES_DE_RESUMEN } from '@/components/office/motor-hojas/TablaVisual';
import { crudoEn, partirClave, type Dinamica, type Libro } from '@/components/office/motor-hojas/modelo';
import type { Motor } from '@/components/office/motor-hojas/formula/calculo';
import { dinamicaBajoSel, RESUMENES_DE_VALOR } from './controlesDinamica';
import './panelDinamica.css';

/**
 * El panel de campos de una tabla dinámica — el «Campos de tabla dinámica» de
 * Excel, en miniatura (bloques 49, 50 y 51).
 *
 * Entra por `panelFijo` y llama al MISMO `gesto(control, valor)` que llamaría
 * un botón de la cinta, así que cada botón de aquí pasa por `revisar`, por la
 * grabadora y por el corte del modo guía como cualquier otro (molde:
 * `PanelYSi.tsx`, `PanelMacros.tsx`). Los cuatro controles que pulsa viven en
 * `controlesDinamica.ts`, al lado, y el porqué de que los dos estén en `comun/`
 * y no en la carpeta de una clase está escrito allí.
 *
 * ── SIN ARRASTRAR, Y A PROPÓSITO ────────────────────────────────────────────
 *
 * En Excel los campos se arrastran con el ratón a cuatro cajones. Aquí cada
 * campo lleva sus botones —Filas, Columnas, Valores, Quitar— y el efecto es
 * exactamente el mismo gesto (`campo-dinamica` con su zona). Se eligió así por
 * dos motivos que no son de gusto: un arrastre no se puede señalar con el aro
 * del modo guía —§37 pide señalar **el botón exacto**— y un arrastre tampoco se
 * graba solo en una macro. Lo que la clase enseña es que **mover un campo de
 * sitio cambia la pregunta**, y eso se ve igual pulsando que arrastrando.
 *
 * ── EL BOTÓN DE ACTUALIZAR VA ARRIBA Y ES EL MÁS GRANDE ─────────────────────
 *
 * Porque la clase 49 gira alrededor de él: la dinámica no mira la hoja, mira la
 * copia que se llevó la última vez. Un botón escondido al fondo del panel
 * convertiría la lección en una anécdota.
 */

/** Los nombres de los campos del origen: su fila de encabezados, en orden. */
export function camposDe(libro: Libro, din: Dinamica): string[] {
  const o = partirOrigen(libro, din.origen, partirClave(din.ancla)?.hoja ?? libro.activa);
  if (!o) return [];
  const fuera: string[] = [];
  for (let c = o.c0; c <= o.c1; c += 1) fuera.push(crudoEn(libro, o.hoja, c, o.f0) || `Columna ${c - o.c0 + 1}`);
  return fuera;
}

/** Dónde está ahora mismo cada campo, en una frase corta para el panel. */
function zonaDe(din: Dinamica, campo: number): string {
  const v = din.valores.find((x) => x.col === campo);
  if (v) return `Valores · ${NOMBRES_DE_RESUMEN[v.resumen] ?? v.resumen}`;
  const enFilas = din.filas.indexOf(campo);
  if (enFilas >= 0) return enFilas === 0 ? 'Filas' : `Filas · nivel ${enFilas + 1}`;
  const enCols = din.columnas.indexOf(campo);
  if (enCols >= 0) return enCols === 0 ? 'Columnas' : `Columnas · nivel ${enCols + 1}`;
  return '';
}

/** Cuántas filas del origen entraron en el resumen que se está viendo. */
function ventasResumidas(motor: Motor, din: Dinamica): number {
  return dinamicaPintada(motor, din)?.origenFilas ?? 0;
}

export function PanelDinamica({ sel, libro, motor, hoja, gesto }: PanelDeClaseProps) {
  const seleccionTexto = textoDeCaja(sel);
  const din = dinamicaBajoSel({ motor, hoja, sel });
  const campos = din ? camposDe(libro, din) : [];

  /* ── crear: dónde se va a pintar ── */
  const [donde, setDonde] = useState('');

  /* ── agrupar: qué campo, dentro de cuál ── */
  const [queCampo, setQueCampo] = useState('');
  const [dentroDe, setDentroDe] = useState('');

  /**
   * El cuadro de crear, que **sigue estando aunque ya haya una dinámica**.
   *
   * En Excel se pueden insertar varias, y aquí hace falta por dos motivos
   * concretos: el tablero (bloque 58) monta tres sobre la misma hoja, y —lo que
   * importa hoy— el origen de una dinámica **no se puede cambiar después**, así
   * que un alumno que la creara sobre un rango corto se quedaría atrapado con
   * ella si este cuadro desapareciera al crear la primera. Con él, se hace otra
   * bien y el panel obedece a la última (ver `dinamicaBajoSel`).
   */
  const cuadroDeCrear = (
    <section className="pdn-seccion">
      <h4>{din ? 'Crear otra' : 'Crear tabla dinámica'}</h4>
      <p className="pdn-ayuda">
        Ponte en cualquier celda de la lista —se toma entera, con sus encabezados, como en Excel— y escribe en qué celda
        quieres que se pinte el resumen. Si marcas tú un rango, se usa ese.
      </p>
      <div className="pdn-fila">
        <input
          aria-label="Dónde ponerla"
          type="text"
          placeholder="Dónde ponerla"
          value={donde}
          onChange={(e) => setDonde(e.target.value)}
        />
        <button type="button" data-control="crear-dinamica" onClick={() => gesto('crear-dinamica', donde.trim())}>
          Crear tabla dinámica
        </button>
      </div>
    </section>
  );

  if (!din) {
    return (
      <div className="pdn">
        <p className="pdn-sel">
          Seleccionado: <b>{seleccionTexto}</b>
        </p>
        {cuadroDeCrear}
      </div>
    );
  }

  const enValores = din.valores;
  const enEjes = [...din.filas, ...din.columnas];

  return (
    <div className="pdn">
      <button
        type="button"
        className="pdn-actualizar"
        data-control="actualizar-dinamica"
        onClick={() => gesto('actualizar-dinamica')}
      >
        <span aria-hidden="true">↻</span> Actualizar
      </button>
      <p className="pdn-ayuda pdn-ayuda-actualizar">
        Resumiendo <b data-dinamica-filas={din.id}>{ventasResumidas(motor, din)}</b> ventas, las de la última vez que
        actualizaste. Si cambias un dato del origen, aquí no se va a enterar hasta que pulses este botón.
      </p>

      <section className="pdn-seccion">
        <h4>Campos</h4>
        <p className="pdn-ayuda">Manda cada campo a un sitio. Filas y columnas son excluyentes: el segundo lo mueve.</p>
        <ul className="pdn-campos">
          {campos.map((nombre, i) => {
            const sitio = zonaDe(din, i);
            return (
              <li key={nombre} className={`pdn-campo${sitio ? ' es-puesto' : ''}`} data-campo={i}>
                <span className="pdn-campo-nombre">{nombre}</span>
                {sitio && <span className="pdn-campo-zona">{sitio}</span>}
                <div className="pdn-fila">
                  {(
                    [
                      ['filas', 'Filas'],
                      ['columnas', 'Columnas'],
                      ['valores', 'Valores'],
                      ['fuera', 'Quitar'],
                    ] as const
                  ).map(([zona, rotulo]) => (
                    <button
                      key={zona}
                      type="button"
                      data-control="campo-dinamica"
                      data-campo={i}
                      data-zona={zona}
                      title={`${nombre} → ${rotulo}`}
                      onClick={() => gesto('campo-dinamica', `${i}|${zona}`)}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {enValores.length > 0 && (
        <section className="pdn-seccion">
          <h4>Resumir con</h4>
          <p className="pdn-ayuda">
            El mismo cruce contesta cosas distintas según cómo se resuma: no es lo mismo cuánto dinero deja algo que
            cuántas veces se vende.
          </p>
          {enValores.map((v) => (
            <div key={v.col} className="pdn-fila">
              <span className="pdn-campo-nombre">{campos[v.col] ?? `Campo ${v.col + 1}`}</span>
              <select
                aria-label={`Resumir ${campos[v.col] ?? `campo ${v.col + 1}`}`}
                data-resumen-de={v.col}
                value={v.resumen}
                onChange={(e) => gesto('campo-dinamica', `${v.col}|valores|${e.target.value}`)}
              >
                {RESUMENES_DE_VALOR.map((r) => (
                  <option key={r} value={r}>
                    {NOMBRES_DE_RESUMEN[r] ?? r}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </section>
      )}

      <section className="pdn-seccion">
        <h4>Agrupar</h4>
        <p className="pdn-ayuda">Mete un campo dentro de otro: cada grupo del de fuera se abre en los del de dentro.</p>
        <div className="pdn-fila">
          <select
            aria-label="Campo que se agrupa"
            value={queCampo}
            onChange={(e) => setQueCampo(e.target.value)}
          >
            <option value="">Qué campo…</option>
            {campos.map((nombre, i) => (
              <option key={nombre} value={i}>
                {nombre}
              </option>
            ))}
          </select>
          <select aria-label="Dentro de qué campo" value={dentroDe} onChange={(e) => setDentroDe(e.target.value)}>
            <option value="">Dentro de…</option>
            {enEjes.map((i) => (
              <option key={i} value={i}>
                {campos[i] ?? `Campo ${i + 1}`}
              </option>
            ))}
            <option value="-1">— sacarlo al primer nivel —</option>
          </select>
          <button
            type="button"
            data-control="agrupar-dinamica"
            disabled={queCampo === '' || dentroDe === ''}
            onClick={() => gesto('agrupar-dinamica', `${queCampo}|${dentroDe}`)}
          >
            Agrupar
          </button>
        </div>
      </section>

      {cuadroDeCrear}
    </div>
  );
}

export default PanelDinamica;
