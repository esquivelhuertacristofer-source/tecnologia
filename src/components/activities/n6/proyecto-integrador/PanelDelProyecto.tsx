'use client';

import type { PanelDeClaseProps } from '@/components/office/VentanaDiapositivas';
import { DATOS_ESCUELA } from './mapaSitios';
import { afirmacionDe } from './pruebas';

/**
 * `n6-proyecto-integrador` · el panel fijo de Bit en el acto 2 (`panelFijo`).
 *
 * «Aquí vive la tabla del grupo, para poder volver a mirarla sin salir del
 * programa» (pliego). Desde el §69.5 ya no lista frases para copiar: enseña
 * qué TIPOS de cosa se pueden decir con una tabla, y lo que el juez dice de
 * la frase que el alumno escribió — después de escribirla, nunca antes.
 */
const TIPOS_DE_FRASE = [
  'Qué es lo que más (o menos) se tira',
  'Si una cosa se tira más que otra',
  'Qué día se juntó más (o menos)',
  'Qué parte del total es algo: la mitad, la cuarta parte…',
];

const ETIQUETA: Record<string, string> = {
  sostenida: '✅ La tabla lo sostiene',
  falsa: '❌ La tabla no lo sostiene',
  'fuera-de-alcance': '🔭 Eso no lo mediste',
  'no-entiendo': '🤔 No sé qué comprobar',
};

export function PanelDelProyecto({ mazo }: PanelDeClaseProps) {
  const actual = afirmacionDe(mazo);
  return (
    <div className="pdp-panel">
      {actual && (
        <div className={`pdp-juicio es-${actual.juicio.veredicto}`} data-testid="pdp-juicio" data-veredicto={actual.juicio.veredicto}>
          <p className="pdp-juicio-titulo">{ETIQUETA[actual.juicio.veredicto]}</p>
          <p className="pdp-juicio-frase">«{actual.texto}»</p>
          <p>{actual.juicio.motivo}</p>
        </div>
      )}
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

      <p className="pdp-titulo">Con una tabla se puede decir…</p>
      <ul className="pdp-afirmaciones">
        {TIPOS_DE_FRASE.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p className="pdp-nota">
        Escribe tu frase como título de la diapositiva 2, con tus palabras. Primero la frase; después la gráfica.
      </p>
    </div>
  );
}

export default PanelDelProyecto;
