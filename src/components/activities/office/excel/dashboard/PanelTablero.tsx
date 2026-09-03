'use client';

import type { PanelDeClaseProps } from '@/components/office/VentanaHojas';
import { hojaDe } from '@/components/office/motor-hojas/modelo';
import PanelDinamica from '../comun/PanelDinamica';
import './panelTablero.css';

/**
 * El panel de `of-excel-dashboard` (bloque 58): **lo que hay puesto encima de
 * la hoja**, y debajo el panel de tabla dinámica de siempre.
 *
 * ── POR QUÉ ENVUELVE A `PanelDinamica` EN VEZ DE COPIARLO ───────────────────
 *
 * `panelFijo` admite un solo componente y esta clase necesita dos cosas: la
 * dinámica (que ya está construida y probada en `comun/`) y una lista de los
 * objetos que flotan sobre la hoja. Envolverlo cuesta una línea y **no toca
 * `PanelDinamica`**: la clase 49 sigue viendo exactamente el panel que ya tenía,
 * y el día que alguien lo mejore, esta clase se lleva la mejora sola. Copiarlo
 * habría sido el defecto que `controlesDinamica.ts` dejó escrito el día que lo
 * mudaron a `comun/` — una copia se separa del original en cuanto uno de los dos
 * se arregla.
 *
 * ── LA LISTA VA ARRIBA, Y NO ES DECORACIÓN ──────────────────────────────────
 *
 * Es la sección que la clase entera necesita: **un tablero se arma quitando**, y
 * para quitar hay que poder ver qué hay puesto. En Excel esto es el panel
 * «Selección» (Inicio → Buscar y seleccionar → Panel de selección), que hace
 * exactamente esto: enumera los objetos que flotan sobre la hoja. Aquí van con
 * su ✕ al lado, igual que las reglas en `PanelReglas.tsx` y los escenarios en
 * `PanelYSi.tsx`.
 *
 * Cada botón llama al MISMO `gesto(control, valor)` que llamaría un botón de la
 * cinta, así que pasa por `revisar`, por la guarda del desvío, por deshacer y
 * por la grabadora. No hay puerta trasera: `borrar-grafico` es, para el resto de
 * la ventana, un botón de la cinta más (`controles.ts`, al lado).
 */

const NOMBRE_DE_TIPO: Record<string, string> = {
  columnas: 'columnas',
  barras: 'barras',
  lineas: 'líneas',
  circular: 'circular',
  dispersion: 'dispersión',
};

/** `tab!C3` → `C3`. Lo que el alumno tiene delante es la dirección, no la clave. */
const direccionDe = (k: string): string => k.slice(k.lastIndexOf('!') + 1);

export function PanelTablero(props: PanelDeClaseProps) {
  const { libro, hoja, gesto } = props;
  const h = hojaDe(libro, hoja);
  const graficas = h?.graficas ?? [];
  const minigraficos = h?.minigraficos ?? [];
  const reglas = h?.reglas ?? [];
  const cuantos = minigraficos.length;

  return (
    <div className="ptb">
      <section className="ptb-seccion">
        <h4>Lo que hay puesto encima de la hoja</h4>
        <p className="ptb-ayuda">
          Todo lo que flota sobre el tablero, con su ✕. Antes de añadir nada, mira si lo que ya hay contesta alguna de
          las preguntas que te hicieron.
        </p>

        {graficas.length === 0 ? (
          <p className="ptb-vacio">Ninguna gráfica.</p>
        ) : (
          <ul className="ptb-lista">
            {graficas.map((g) => (
              <li key={g.id}>
                <span>
                  <b>{g.titulo?.trim() || 'Gráfica sin título'}</b>
                  <span className="ptb-detalle">
                    {' '}
                    · {NOMBRE_DE_TIPO[g.tipo] ?? g.tipo} · {g.datos || 'de una dinámica'}
                  </span>
                </span>
                <button
                  type="button"
                  data-control="borrar-grafico"
                  data-grafica={g.id}
                  title={`Quitar «${g.titulo?.trim() || g.tipo}» del tablero`}
                  aria-label={`Quitar la gráfica ${g.titulo?.trim() || g.tipo}`}
                  onClick={() => gesto('borrar-grafico', g.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {cuantos === 0 ? (
          <p className="ptb-vacio">Ningún minigráfico.</p>
        ) : (
          <div className="ptb-fila">
            <span>
              <b>
                {cuantos} minigráfico{cuantos === 1 ? '' : 's'}
              </b>
              <span className="ptb-detalle">
                {' '}
                · en {minigraficos.map((m) => direccionDe(m.celda)).join(', ')}
              </span>
            </span>
            <button
              type="button"
              data-control="borrar-minigraficos"
              title="Quitar todos los minigráficos de esta hoja"
              onClick={() => gesto('borrar-minigraficos', 'todos')}
            >
              Quitarlos
            </button>
          </div>
        )}

        {/*
         * Las reglas de formato condicional, con su ✕.
         *
         * No es simetría: **sin esto la clase se podía volver imposible de
         * terminar**, y se vio antes de que le pasara a nadie. El encargo del
         * color exige que se pinte UNA de las tres celdas de la banda y sólo
         * una; una regla anterior que pintara de más —marcar B4:B8 y escribir
         * `=B4>0`— se queda viva encima del rango, `condicional.ts` sólo AÑADE
         * pintura y nunca la quita, y el alumno no tenía por dónde deshacerla:
         * volver a aplicar sólo reemplaza la regla del MISMO id, o sea del
         * mismo rango. Es la misma familia de defecto que `of-excel-datos-
         * limpios` cazó en `regla-formula` (apilar en vez de reemplazar), con
         * un rango distinto en vez del mismo.
         */}
        {reglas.length > 0 && (
          <ul className="ptb-lista">
            {reglas.map((r) => (
              <li key={r.id}>
                <span>
                  <b>Regla de color</b>
                  <span className="ptb-detalle"> · {r.clase} · {r.rango}</span>
                </span>
                <button
                  type="button"
                  data-control="borrar-reglas"
                  data-regla={r.id}
                  title={`Quitar la regla de ${r.rango}`}
                  aria-label={`Quitar la regla de ${r.rango}`}
                  onClick={() => gesto('borrar-reglas', r.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PanelDinamica {...props} />
    </div>
  );
}

export default PanelTablero;
