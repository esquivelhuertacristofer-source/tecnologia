'use client';

import { useState } from 'react';
import type { PanelDeClaseProps } from '@/components/office/VentanaHojas';
import { textoDeCaja } from '@/components/office/motor-hojas/comandos';
import { coincidencias, resolverIrA, valorDe } from '@/components/office/motor-hojas/consultas';
import { aTexto, dir, partirClave, type Clave } from '@/components/office/motor-hojas/modelo';
import './panelValidacion.css';

/**
 * El panel de `of-excel-validacion`: los cinco controles del paquete
 * VALIDACIÓN que todavía no tenían cuadro de diálogo (bloques 32 y 39).
 *
 * `validar`, `quitar-validacion` y `reemplazar` llaman al MISMO
 * `gesto(control, valor)` que llamaría un botón de la cinta —los tres ya
 * viven en el `CONTROLES` global de `cinta.ts`, cableados desde antes de
 * esta clase—, así que este panel no necesita ninguna `ControlesDeClase`
 * propia: es el mismo molde que `PanelTablas.tsx`
 * (`of-excel-tablas-y-filtros`), sólo que ahí los nueve comandos SÍ eran
 * nuevos y aquí no.
 *
 * `buscar` e `ir-a` son distintos: no tocan el libro —viven en
 * `SOLO_VENTANA` (`cinta.ts`)—, así que aquí se resuelven en el momento,
 * sobre estado local, con las dos funciones puras de `consultas.ts`:
 * `coincidencias()` y `resolverIrA()`. Ninguno de los dos pasa por
 * `gesto()`, y por eso ninguno de los dos puede grabarse en una macro —lo
 * mismo que ya pasa con Copiar—: no hay nada del libro que grabar.
 *
 * El botón de este panel usa `data-control="buscar-panel"` y no `"buscar"`
 * a secas: la cinta compartida (`tecniaHojas.ts`, grupo Edición) ya trae un
 * botón «Buscar» propio —inerte, `{ gesto: () => null }` en `cinta.ts`,
 * puesto ahí para el paquete VALIDACIÓN entero (bloques 32, 39, 40 y 42)—, y
 * con el mismo `data-control` los dos botones se volvían indistinguibles
 * para `document.querySelector` y para `getByLabelText('Buscar')`: la
 * ventana podía terminar pulsando el de la cinta —que no hace nada— en vez
 * del de aquí. `senal.control` en `guion.ts` usa este mismo id nuevo.
 */

type ClaseValidacion = 'lista' | 'numero' | 'fecha' | 'longitud';

export function PanelValidacion({ libro, motor, hoja, sel, gesto }: PanelDeClaseProps) {
  const seleccionTexto = textoDeCaja(sel);

  /* ── validar ── */
  const [clase, setClase] = useState<ClaseValidacion>('lista');
  const [lista, setLista] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [modoBloqueo, setModoBloqueo] = useState<'detener' | 'advertencia'>('detener');
  const [mensaje, setMensaje] = useState('');

  const aplicarValidacion = () => {
    if (clase === 'lista' && !lista.trim()) return;
    if (clase !== 'lista' && !min.trim() && !max.trim()) return;
    const datos = clase === 'lista' ? lista : `${min}-${max}`;
    gesto('validar', `${clase}|${datos}|${modoBloqueo}|${mensaje}`);
  };

  const quitarValidacion = () => gesto('quitar-validacion');

  /* ── buscar ── */
  const [buscarTexto, setBuscarTexto] = useState('');
  const [buscarEnFormulas, setBuscarEnFormulas] = useState(false);
  const [resultadosBuscar, setResultadosBuscar] = useState<Clave[] | null>(null);

  const buscarAhora = () => {
    if (!buscarTexto.trim()) return;
    setResultadosBuscar(coincidencias(motor, hoja, buscarTexto, buscarEnFormulas));
  };

  /* ── ir a ── */
  const [irATexto, setIrATexto] = useState('');
  const [resultadoIrA, setResultadoIrA] = useState<{ ok: boolean; texto: string } | null>(null);

  const irAAhora = () => {
    if (!irATexto.trim()) return;
    const destino = resolverIrA(libro, hoja, irATexto);
    if (!destino) {
      setResultadoIrA({
        ok: false,
        texto: `«${irATexto}» no es ninguna celda, ningún rango y ningún nombre de este libro.`,
      });
      return;
    }
    const nombreHoja = libro.hojas.find((h) => h.id === destino.hoja)?.nombre ?? destino.hoja;
    setResultadoIrA({ ok: true, texto: `${nombreHoja}!${textoDeCaja(destino.caja)}` });
  };

  /*
   * ── reemplazar, con las dos pulsaciones ──
   *
   * `reemplazar` está en `SE_CONFIRMA` (`comandos.ts`): la primera pulsación
   * avisa cuántas celdas —y cuántas fórmulas— va a tocar y no aplica nada; la
   * segunda, con el MISMO rango y el MISMO texto, manda `confirmado` y
   * aplica de verdad. `pidiendoConfirmar` guarda la clave del último intento
   * que pidió confirmación: **no hace falta limpiarla a mano cuando cambian
   * los campos** —no hay ningún `onChange` que la borre—, porque
   * `claveDeIntento` se recalcula en cada render a partir del rango y de los
   * dos campos de ahora mismo. En cuanto uno de los tres cambia, la clave ya
   * es otra cadena y la comparación de abajo cae sola en «intento nuevo»: un
   * borrado manual sería repetir, con más código, lo que la propia
   * comparación ya hace.
   */
  const [reemplazarBuscar, setReemplazarBuscar] = useState('');
  const [reemplazarPor, setReemplazarPor] = useState('');
  const [pidiendoConfirmar, setPidiendoConfirmar] = useState<string | null>(null);

  const claveDeIntento = `${seleccionTexto}|${reemplazarBuscar}|${reemplazarPor}`;

  const intentarReemplazar = () => {
    if (!reemplazarBuscar.trim()) return;
    const base = `${reemplazarBuscar}|${reemplazarPor}`;
    gesto('reemplazar', pidiendoConfirmar === claveDeIntento ? `${base}|confirmado` : base);
    setPidiendoConfirmar(claveDeIntento);
  };

  return (
    <div className="pva">
      <p className="pva-sel">
        Selección actual: <b>{seleccionTexto}</b>
      </p>

      <section className="pva-seccion">
        <h4>Validación de datos</h4>
        <p className="pva-ayuda">
          Marca el rango y define la regla. Ojo: sólo vigila lo que se escriba de aquí en adelante.
        </p>
        <div className="pva-fila">
          <select aria-label="Tipo de regla" value={clase} onChange={(e) => setClase(e.target.value as ClaseValidacion)}>
            <option value="lista">Lista</option>
            <option value="numero">Número</option>
            <option value="fecha">Fecha</option>
            <option value="longitud">Longitud del texto</option>
          </select>
          <select
            aria-label="Si no cumple"
            value={modoBloqueo}
            onChange={(e) => setModoBloqueo(e.target.value as 'detener' | 'advertencia')}
          >
            <option value="detener">Detener</option>
            <option value="advertencia">Advertencia</option>
          </select>
        </div>
        {clase === 'lista' ? (
          <input
            aria-label="Opciones, separadas por comas"
            type="text"
            placeholder="Bebidas, Postres, Antojitos, Guisados"
            value={lista}
            onChange={(e) => setLista(e.target.value)}
          />
        ) : (
          <div className="pva-fila">
            <input aria-label="Mínimo" type="number" placeholder="Mínimo" value={min} onChange={(e) => setMin(e.target.value)} />
            <input aria-label="Máximo" type="number" placeholder="Máximo" value={max} onChange={(e) => setMax(e.target.value)} />
          </div>
        )}
        <input
          aria-label="Mensaje de entrada (opcional)"
          type="text"
          placeholder="Mensaje de entrada (opcional)"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
        />
        <div className="pva-fila">
          <button type="button" data-control="validar" onClick={aplicarValidacion}>
            Validar
          </button>
          <button type="button" data-control="quitar-validacion" onClick={quitarValidacion}>
            Quitar validación
          </button>
        </div>
      </section>

      <section className="pva-seccion">
        <h4>Buscar</h4>
        <p className="pva-ayuda">Por omisión mira lo que la celda ENSEÑA. Con «buscar en fórmulas» mira el texto de la regla.</p>
        <div className="pva-fila">
          <input aria-label="Buscar texto" type="text" value={buscarTexto} onChange={(e) => setBuscarTexto(e.target.value)} />
          <button type="button" data-control="buscar-panel" onClick={buscarAhora}>
            Buscar
          </button>
        </div>
        <label className="pva-check">
          <input
            type="checkbox"
            checked={buscarEnFormulas}
            onChange={(e) => setBuscarEnFormulas(e.target.checked)}
          />
          Buscar en fórmulas
        </label>
        {resultadosBuscar && (
          <p className="pva-resultado">
            {resultadosBuscar.length === 0
              ? 'No se encontró nada.'
              : `${resultadosBuscar.length} coincidencia(s): ${resultadosBuscar
                  .map((k) => {
                    const p = partirClave(k);
                    if (!p) return k;
                    const d = dir(p.col, p.fila);
                    return `${d} (${aTexto(valorDe(motor, hoja, d))})`;
                  })
                  .join(', ')}`}
          </p>
        )}
      </section>

      <section className="pva-seccion">
        <h4>Ir a</h4>
        <p className="pva-ayuda">Una celda, un rango, o un nombre que ya esté puesto en el libro.</p>
        <div className="pva-fila">
          <input aria-label="Ir a" type="text" value={irATexto} onChange={(e) => setIrATexto(e.target.value)} />
          <button type="button" data-control="ir-a" onClick={irAAhora}>
            Ir a
          </button>
        </div>
        {resultadoIrA && (
          <p className={`pva-resultado${resultadoIrA.ok ? '' : ' es-error'}`}>{resultadoIrA.texto}</p>
        )}
      </section>

      <section className="pva-seccion">
        <h4>Reemplazar</h4>
        <p className="pva-ayuda">Marca el rango. Antes de tocar nada, avisa cuántas celdas —y cuántas fórmulas— va a cambiar.</p>
        <div className="pva-fila">
          <input
            aria-label="Buscar (reemplazar)"
            type="text"
            placeholder="Buscar"
            value={reemplazarBuscar}
            onChange={(e) => setReemplazarBuscar(e.target.value)}
          />
          <input
            aria-label="Reemplazar por"
            type="text"
            placeholder="Reemplazar por"
            value={reemplazarPor}
            onChange={(e) => setReemplazarPor(e.target.value)}
          />
          <button type="button" data-control="reemplazar" onClick={intentarReemplazar} disabled={!reemplazarBuscar.trim()}>
            Reemplazar
          </button>
        </div>
      </section>
    </div>
  );
}

export default PanelValidacion;
