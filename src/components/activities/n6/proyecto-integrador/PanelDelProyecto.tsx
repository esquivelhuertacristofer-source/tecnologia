'use client';

import type { PanelDeClaseProps } from '@/components/office/VentanaDiapositivas';
import { DATOS_ESCUELA } from './mapaSitios';
import { AFIRMACIONES } from './pruebas';

/**
 * `n6-proyecto-integrador` · el panel fijo de Bit en el acto 2 (`panelFijo`).
 *
 * «Aquí vive la tabla del grupo, para poder volver a mirarla sin salir del
 * programa» (pliego). Las seis frases se listan SIN decir cuáles sostiene la
 * tabla — decirlo aquí resolvería el E4 solo, y el encargo es que el alumno
 * lo razone mirando los números.
 */
export function PanelDelProyecto({}: PanelDeClaseProps) {
  return (
    <div className="pdp-panel">
      <p className="pdp-titulo">La tabla del grupo</p>
      <table className="pdp-tabla">
        <tbody>
          {DATOS_ESCUELA.map((fila) => (
            <tr key={fila.etiqueta}>
              <th scope="row">{fila.etiqueta}</th>
              <td>{fila.valor}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="pdp-titulo">Lo que podrías sostener</p>
      <ul className="pdp-afirmaciones">
        {AFIRMACIONES.map((a) => (
          <li key={a.id}>{a.texto}</li>
        ))}
      </ul>
      <p className="pdp-nota">
        No todas las de arriba las sostiene la tabla. Primero se escribe lo que quieres sostener; después se elige
        la gráfica.
      </p>
    </div>
  );
}

export default PanelDelProyecto;
