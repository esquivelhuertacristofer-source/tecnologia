'use client';

import { useState } from 'react';
import type { PanelDeClaseProps } from '@/components/office/VentanaHojas';
import { etiquetaDe } from '@/components/office/motor-hojas/comandos';
import './panelMacros.css';

/**
 * El panel de `of-excel-macros` (bloques 55 y 56): grabar, parar, la lista de
 * macros guardadas —con sus pasos traducidos al español por `etiquetaDe`—,
 * ejecutar, borrar y asignar a un botón. Mismo molde que `PanelTablas.tsx`
 * (`of-excel-tablas-y-filtros`) y `PanelValidacion.tsx` (`of-excel-validacion`):
 * entra por `panelFijo` y llama al MISMO `gesto(control, valor)` que llamaría
 * un botón de la cinta, así que cada botón de aquí pasa por `revisar`, por la
 * grabadora y por el corte del modo guía como cualquier otro.
 *
 * Los cinco comandos —`grabar-macro`, `parar-macro`, `ejecutar-macro`,
 * `borrar-macro` y `asignar-macro`— no son nuevos: ya viven en el `CONTROLES`
 * global de `cinta.ts` desde que se construyó el motor de macros (§45.6). Este
 * panel es la única puerta de la ventana que los pinta, porque ninguna cinta
 * les da un botón propio (`FUERA_DE_LA_CINTA`, en `VentanaHojas.tsx`).
 *
 * ── El nombre viaja como texto, no como estado del motor ────────────────────
 *
 * `grabar-macro` está en `SE_CONFIRMA` (`comandos.ts`), pero a diferencia de
 * `reemplazar` en `PanelValidacion.tsx` —que SIEMPRE avisa en la primera
 * pulsación, tocas lo que toques— su pregunta es CONDICIONAL: `revisar()`
 * sólo la hace cuando `libro.macros?.[nombre]` ya existe (`comandos.ts`,
 * «ya existe una macro llamada…»). Grabar sobre un nombre nuevo no avisa
 * nada y arranca directo. Por eso `pidiendoConfirmar` no se ceba en CADA
 * pulsación como en el molde: sólo se enciende cuando el nombre de este
 * intento YA está en `libro.macros` —la misma condición que usa el motor—,
 * y si no, se apaga. Sin ese cuidado, grabar una macro nueva la primera vez
 * dejaba `pidiendoConfirmar` encendido con ese nombre para siempre, y la
 * PRÓXIMA vez que alguien grabara encima de ese mismo nombre —minutos
 * después, con la macro ya guardada de verdad— el panel mandaba
 * `confirmado` sin que el motor hubiera preguntado nada: sobrescribía en
 * silencio la macro que ya existía, sin el aviso que el bloque 55 pide
 * enseñar. La comparación (`pidiendoConfirmar === nombre`) se sigue
 * recalculando sola en cada render a partir del campo de texto de AHORA.
 *
 * ── Por qué no hay un indicador de «grabando ahora mismo» ───────────────────
 *
 * Lo hubo en un primer borrador, con un `useState<string | null>` que se
 * encendía al pulsar Grabar y se apagaba al pulsar Detener. Se quitó: la
 * `Grabadora` de verdad vive en un `ref` dentro de `VentanaHojas.tsx` y este
 * panel no la ve —por diseño, la misma disciplina que ya usa el portapapeles
 * (`ContextoCinta.corte`)—, así que un indicador local se desincroniza en
 * cuanto `parar-macro` se RECHAZA (macro vacía, bloque 55 «jugar mal»): el
 * panel diría «detenida» y la grabadora de verdad seguiría encendida. Mejor
 * ningún indicador que uno que miente a veces; el aviso de la ventana —que sí
 * habla con la grabadora real— es quien dice la verdad en ese momento.
 */

export function PanelMacros({ libro, gesto }: PanelDeClaseProps) {
  const [nombreNuevo, setNombreNuevo] = useState('');
  /*
   * CORREGIDO 1-sep-2026 (auditoría). Guardaba sólo el nombre, y eso deja la
   * confirmación viva después de consumirla: tras sobrescribir «FormatoSemanal»
   * una vez, `yaExiste` sigue siendo cierto, así que `pidiendoConfirmar` volvía
   * a quedarse con ese nombre y la siguiente pulsación grababa encima OTRA VEZ
   * sin avisar. Justo lo que este bloque existe para enseñar («no se pregunta
   * dos veces si ya se preguntó una» era la lección, no el comportamiento).
   *
   * Se guarda también el libro, que es el molde que ya usaba `PanelYSi.tsx`:
   * cualquier gesto que cambie el libro cambia su referencia y la confirmación
   * pendiente caduca sola, sin tener que acordarse de limpiarla a mano.
   */
  const [pidiendoConfirmar, setPidiendoConfirmar] = useState<{ nombre: string; libro: typeof libro } | null>(null);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [nombreBoton, setNombreBoton] = useState('');
  const [macroParaBoton, setMacroParaBoton] = useState('');

  const nombresMacro = Object.keys(libro.macros ?? {});

  const grabar = () => {
    const nombre = nombreNuevo.trim();
    if (!nombre) return;
    const yaExiste = Boolean(libro.macros?.[nombre]);
    const confirma = pidiendoConfirmar?.nombre === nombre && pidiendoConfirmar.libro === libro;
    gesto('grabar-macro', yaExiste && confirma ? `${nombre}|confirmado` : nombre);
    setPidiendoConfirmar(yaExiste ? { nombre, libro } : null);
  };

  const parar = () => gesto('parar-macro');

  const asignar = () => {
    const boton = nombreBoton.trim();
    if (!boton || !macroParaBoton) return;
    gesto('asignar-macro', `${boton}|${macroParaBoton}`);
  };

  return (
    <div className="pmc">
      <section className="pmc-seccion">
        <h4>Grabar</h4>
        <p className="pmc-ayuda">
          Ponle nombre y pulsa Grabar. Desde ese momento, todo lo que hagas —lo bueno y lo que corrijas— se
          apunta en la lista, en el orden en que pasó.
        </p>
        <div className="pmc-fila">
          <input
            aria-label="Nombre de la macro"
            type="text"
            placeholder="Nombre de la macro"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
          />
          <button type="button" data-control="grabar-macro" onClick={grabar}>
            Grabar
          </button>
          <button type="button" data-control="parar-macro" onClick={parar}>
            Detener grabación
          </button>
        </div>
      </section>

      <section className="pmc-seccion">
        <h4>Tus macros</h4>
        {nombresMacro.length === 0 ? (
          <p className="pmc-ayuda">Todavía no has grabado ninguna.</p>
        ) : (
          <ul className="pmc-lista">
            {nombresMacro.map((nombre) => {
              const pasos = libro.macros?.[nombre] ?? [];
              return (
                <li key={nombre} className="pmc-macro">
                  <div className="pmc-macro-cab">
                    <strong>{nombre}</strong>
                    <span className="pmc-macro-cuenta">{pasos.length} paso(s)</span>
                  </div>
                  <div className="pmc-fila">
                    <button type="button" onClick={() => setExpandida((x) => (x === nombre ? null : nombre))}>
                      {expandida === nombre ? 'Ocultar los pasos' : 'Ver los pasos'}
                    </button>
                    <button type="button" data-control="ejecutar-macro" onClick={() => gesto('ejecutar-macro', nombre)}>
                      Ejecutar
                    </button>
                    <button type="button" data-control="borrar-macro" onClick={() => gesto('borrar-macro', nombre)}>
                      Borrar
                    </button>
                  </div>
                  {expandida === nombre && (
                    <ol className="pmc-pasos">
                      {pasos.map((g, i) => (
                        <li key={i}>{etiquetaDe(g)}</li>
                      ))}
                    </ol>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="pmc-seccion">
        <h4>Asignar a un botón</h4>
        <p className="pmc-ayuda">Ponle un nombre al botón y elige qué macro dispara.</p>
        <div className="pmc-fila">
          <input
            aria-label="Nombre del botón"
            type="text"
            placeholder="Nombre del botón"
            value={nombreBoton}
            onChange={(e) => setNombreBoton(e.target.value)}
          />
          <select aria-label="Macro a asignar" value={macroParaBoton} onChange={(e) => setMacroParaBoton(e.target.value)}>
            <option value="">Macro…</option>
            {nombresMacro.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
          </select>
          <button type="button" data-control="asignar-macro" onClick={asignar}>
            Asignar
          </button>
        </div>
        {Object.keys(libro.botones ?? {}).length > 0 && (
          <ul className="pmc-botones">
            {Object.entries(libro.botones ?? {}).map(([boton, macro]) => (
              <li key={boton}>
                <b>{boton}</b> → {libro.macros?.[macro] ? macro : `${macro} (ya no existe)`}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default PanelMacros;
