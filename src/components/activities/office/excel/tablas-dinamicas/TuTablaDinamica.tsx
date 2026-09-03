'use client';

import type { PanelDeClaseProps } from '@/components/office/VentanaHojas';
import { esError, textoDeNumero, type Valor } from '@/components/office/motor-hojas/modelo';
import { tablaDinamicaAMano } from './guion';
import './tuTablaDinamica.css';

/**
 * «Tu tabla dinámica a mano» — el panel de clase de `n8-tablas-dinamicas`.
 *
 * ── LO QUE ESTE PANEL NO HACE, Y ES LO QUE LO SEPARA DE UN CORRECTOR ────────
 *
 * **No cierra ningún encargo.** Quien corrige es el guion, con sus predicados
 * (canon, prueba 3: un armazón —o un panel— que sabe si el alumno acertó es un
 * motor de plantillas). Esto es una lectura en vivo de las celdas G7:I12: cinco
 * filas de categoría más el total general, exactamente la forma que tendría
 * una tabla dinámica de verdad (`motor-hojas/dinamica.ts`) si arrastraras un
 * campo a Filas y tres a Valores. La diferencia es que aquí cada celda la
 * escribiste tú, y este panel sólo te la enseña ya formateada mientras
 * trabajas.
 *
 * Una fila «pendiente» no enseña un cero: enseña un guión — un cero sería
 * mentir sobre una cuenta que todavía no se ha hecho (la misma regla del
 * bloque 15 que ya defendió `n8-limpieza-de-datos`).
 */
export function TuTablaDinamica({ libro }: PanelDeClaseProps) {
  const filas = tablaDinamicaAMano(libro);
  const hechas = filas.filter((f) => f.completa).length;

  return (
    <div className="tdam">
      <p className="tdam-intro">
        Cinco categorías y un total general — lo que arma sola una tabla dinámica, aquí construido celda a celda.
      </p>

      <p className="tdam-marcador">
        <b>
          {hechas} de {filas.length}
        </b>
        <span>filas completas</span>
      </p>

      <div className="tdam-tabla" role="table" aria-label="Tu tabla dinámica a mano">
        <div className="tdam-fila tdam-cabecera" role="row">
          <span role="columnheader">Categoría</span>
          <span role="columnheader">Dinero</span>
          <span role="columnheader">Ventas</span>
          <span role="columnheader">Promedio</span>
        </div>
        {filas.map((f) => (
          <div
            key={f.etiqueta}
            className="tdam-fila"
            role="row"
            data-total={f.esTotal ? 'si' : 'no'}
            data-completa={f.completa ? 'si' : 'no'}
          >
            <span role="cell" className="tdam-etiqueta">
              {f.etiqueta}
            </span>
            <span role="cell">{formatoDinero(f.dinero)}</span>
            <span role="cell">{formatoCuenta(f.ventas)}</span>
            <span role="cell">{f.esTotal ? '—' : formatoDinero(f.promedio)}</span>
          </div>
        ))}
      </div>

      <p className="tdam-nota">
        La fila de Total general tiene que dar lo mismo que sumar las cinco categorías por separado. Si no cuadra,
        algo en la bitácora está escrito de más de una forma.
      </p>
    </div>
  );
}

function formatoDinero(v: Valor): string {
  if (v === null) return '—';
  if (esError(v)) return v.error;
  if (typeof v === 'number') return `$${textoDeNumero(v)}`;
  return String(v);
}

function formatoCuenta(v: Valor): string {
  if (v === null) return '—';
  if (esError(v)) return v.error;
  if (typeof v === 'number') return textoDeNumero(v);
  return String(v);
}

export default TuTablaDinamica;
