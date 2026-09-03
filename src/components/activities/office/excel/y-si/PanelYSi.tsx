'use client';

import { useState } from 'react';
import type { PanelDeClaseProps } from '@/components/office/VentanaHojas';
import { textoDeCaja } from '@/components/office/motor-hojas/comandos';
import { escenariosDe } from '@/components/office/motor-hojas/ysi';
import type { Libro } from '@/components/office/motor-hojas/modelo';
import './panelYSi.css';

/**
 * El panel de `of-excel-y-si`: los tres huecos de Buscar objetivo y la lista
 * de escenarios (bloque 57). Mismo molde que `PanelTablas.tsx`
 * (`of-excel-tablas-y-filtros`): entra por `panelFijo` y llama al MISMO
 * `gesto(control, valor)` que llamaría un botón de la cinta, así que cada
 * botón de aquí pasa por `revisar`, por la grabadora y por el corte del modo
 * guía como cualquier otro.
 *
 * **La celda objetivo no es un cuarto campo de texto: es la selección
 * actual**, igual que en el cuadro de diálogo de verdad de Excel, que nace
 * con la celda activa ya puesta ahí. `buscarObjetivo` (`motor-hojas/cinta.ts`)
 * ya está construido así —`objetivo: dir(c.sel.c0, c.sel.f0)`—, así que este
 * panel sólo pide los otros dos huecos: el valor deseado y la celda que se
 * puede mover. `dosCampos` (`cinta.ts`) es quien vuelve a leer el `"valor|
 * cambiando"` que arma `buscarObjetivoAhora`.
 *
 * `guardar-escenario` y `aplicar-escenario` están en `SE_CONFIRMA`
 * (`comandos.ts`): la primera pulsación con un intento nuevo avisa y no
 * aplica nada; la segunda, con el MISMO intento, tiene que llevar
 * `confirmado` para que `revisar()` deje pasar el gesto de verdad —el propio
 * `ejecutarVarios` vuelve a llamar a `revisar()` antes de aplicar, así que la
 * ventana bajando su `porConfirmar` no basta por sí sola—. Es el mismo molde
 * que ya usó `PanelValidacion.tsx` para «Reemplazar»: `pidiendoX` guarda la
 * clave del último intento.
 *
 * **Con una diferencia que aquí sí hace falta**: `pidiendoX` guarda TAMBIÉN
 * el `libro` de cuando se pidió, no sólo la clave de texto. Guardar dos veces
 * bajo el mismo nombre —el encargo 8 de esta misma clase— es guardar la
 * MISMA clave («40 alumnos|B4:B5») en dos intentos que de verdad son
 * distintos, separados por otras acciones de por medio; sin el libro, la
 * segunda vez que se pulsa Guardar con esos mismos datos se leería como el
 * «Aceptar» de una pregunta que nunca se hizo, y el aviso no saldría nunca.
 * El libro cambia de referencia en cuanto un gesto se aplica de verdad y se
 * queda SIENDO EL MISMO objeto cuando `revisar()` lo rechaza (la misma regla
 * que documenta `ysi.ts` para una búsqueda que no converge), así que
 * comparar `libro === pidiendoX.libro` es exactamente «¿sigo esperando la
 * confirmación de ESTE intento, o ya pasó algo desde entonces?».
 */

export function PanelYSi({ sel, libro, gesto }: PanelDeClaseProps) {
  const seleccionTexto = textoDeCaja(sel);
  const escenarios = escenariosDe(libro);

  /* ── Buscar objetivo ── */
  const [valorObjetivo, setValorObjetivo] = useState('');
  const [celdaCambia, setCeldaCambia] = useState('');

  const buscarObjetivoAhora = () => {
    if (!valorObjetivo.trim() || !celdaCambia.trim()) return;
    gesto('buscar-objetivo', `${valorObjetivo.trim()}|${celdaCambia.trim().toUpperCase()}`);
  };

  /* ── Guardar un escenario, con las dos pulsaciones ── */
  const [nombreEscenario, setNombreEscenario] = useState('');
  const [pidiendoGuardar, setPidiendoGuardar] = useState<{ clave: string; libro: Libro } | null>(null);
  const claveDeGuardado = `${nombreEscenario.trim()}|${seleccionTexto}`;

  const guardarEscenarioAhora = () => {
    const nombre = nombreEscenario.trim();
    if (!nombre) return;
    const confirma = pidiendoGuardar?.clave === claveDeGuardado && pidiendoGuardar.libro === libro;
    gesto('guardar-escenario', confirma ? `${nombre}|confirmado` : nombre);
    setPidiendoGuardar({ clave: claveDeGuardado, libro });
  };

  /* ── Aplicar y borrar, uno por cada escenario de la lista ── */
  const [pidiendoAplicar, setPidiendoAplicar] = useState<{ nombre: string; libro: Libro } | null>(null);

  const aplicarEscenarioAhora = (nombre: string) => {
    const confirma = pidiendoAplicar?.nombre === nombre && pidiendoAplicar.libro === libro;
    gesto('aplicar-escenario', confirma ? `${nombre}|confirmado` : nombre);
    setPidiendoAplicar({ nombre, libro });
  };

  const borrarEscenarioAhora = (nombre: string) => gesto('borrar-escenario', nombre);

  return (
    <div className="pys">
      <p className="pys-sel">
        Selección actual: <b>{seleccionTexto}</b>
      </p>

      <section className="pys-seccion">
        <h4>Buscar objetivo</h4>
        <p className="pys-ayuda">
          La celda objetivo es la que tengas seleccionada arriba. Di a qué valor tiene que llegar y qué celda se puede mover para lograrlo.
        </p>
        <div className="pys-fila">
          <input
            aria-label="Valor deseado"
            type="number"
            placeholder="Valor deseado"
            value={valorObjetivo}
            onChange={(e) => setValorObjetivo(e.target.value)}
          />
          <input
            aria-label="Celda que cambia"
            type="text"
            placeholder="Celda que cambia"
            value={celdaCambia}
            onChange={(e) => setCeldaCambia(e.target.value)}
          />
        </div>
        <div className="pys-fila">
          <button type="button" data-control="buscar-objetivo" onClick={buscarObjetivoAhora}>
            Buscar objetivo
          </button>
        </div>
      </section>

      <section className="pys-seccion">
        <h4>Guardar un escenario</h4>
        <p className="pys-ayuda">Marca las celdas que quieres guardar y ponle un nombre.</p>
        <div className="pys-fila">
          <input
            aria-label="Nombre del escenario"
            type="text"
            placeholder="Nombre del escenario"
            value={nombreEscenario}
            onChange={(e) => setNombreEscenario(e.target.value)}
          />
          <button type="button" data-control="guardar-escenario" onClick={guardarEscenarioAhora} disabled={!nombreEscenario.trim()}>
            Guardar escenario
          </button>
        </div>
      </section>

      <section className="pys-seccion">
        <h4>Escenarios guardados</h4>
        {escenarios.length === 0 ? (
          <p className="pys-ayuda">Todavía no hay ninguno.</p>
        ) : (
          <ul className="pys-escenarios">
            {escenarios.map((e) => (
              <li key={e.nombre} className="pys-escenario">
                <span className="pys-escenario-nombre">{e.nombre}</span>
                <button
                  type="button"
                  data-control="aplicar-escenario"
                  data-escenario={e.nombre}
                  onClick={() => aplicarEscenarioAhora(e.nombre)}
                >
                  Aplicar
                </button>
                <button
                  type="button"
                  data-control="borrar-escenario"
                  data-escenario={e.nombre}
                  onClick={() => borrarEscenarioAhora(e.nombre)}
                >
                  Borrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default PanelYSi;
