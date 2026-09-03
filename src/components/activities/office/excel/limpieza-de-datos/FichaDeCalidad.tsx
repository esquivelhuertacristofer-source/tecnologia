'use client';

import type { PanelDeClaseProps } from '@/components/office/VentanaHojas';
import { revisionDeCalidad } from './guion';
import './fichaDeCalidad.css';

/**
 * «Ficha de calidad» — el panel de clase de `n8-limpieza-de-datos` (§49.3).
 *
 * Las cinco preguntas que hay que hacerle a cualquier tabla que llegue de
 * fuera, con su respuesta de ahora mismo, leídas del libro en vivo.
 *
 * ── LO QUE ESTE PANEL NO HACE, Y ES LO QUE LO SEPARA DE UN CORRECTOR ────────
 *
 * **No cierra ningún encargo.** Quien corrige es el guion, con sus predicados
 * (canon, prueba 3: un armazón —o un panel— que sabe si el alumno acertó es un
 * motor de plantillas). Esto es un inventario: dice **qué falta por revisar**,
 * que es lo que un analista tiene delante mientras trabaja y lo único de esta
 * clase que se lleva puesto a la siguiente tabla que le llegue en la vida.
 *
 * Por eso tampoco están en el mismo orden que los encargos ni se encienden a la
 * vez que ellos: la de las unidades se enciende con el encargo 9 y la de las
 * categorías con el 12, pero la de los huecos se enciende en cuanto las tres
 * celdas dejan de estar vacías, escriba el alumno lo que escriba en ellas. La
 * ficha mira **el estado de los datos**, no el avance de la clase.
 *
 * Sin `gesto`: aquí no hay ningún botón que pulsar. Es una lectura del libro, y
 * una lectura no necesita puerta de salida.
 */
export function FichaDeCalidad({ libro }: PanelDeClaseProps) {
  const revisiones = revisionDeCalidad(libro);
  const hechas = revisiones.filter((r) => r.hecho).length;

  return (
    <div className="fcal">
      <p className="fcal-intro">
        Antes de calcular nada con una tabla que llegó de fuera, estas cinco preguntas. Se encienden solas al mirar
        los datos.
      </p>

      <p className="fcal-marcador">
        <b>
          {hechas} de {revisiones.length}
        </b>
        <span>revisiones hechas</span>
      </p>

      <ul className="fcal-lista">
        {revisiones.map((r) => (
          <li
            key={r.id}
            className="fcal-item"
            data-revision={r.id}
            data-hecho={r.hecho ? 'si' : 'no'}
            aria-label={`${r.titulo}: ${r.hecho ? 'revisada' : 'pendiente'}`}
          >
            <span className="fcal-marca" aria-hidden>
              {r.hecho ? '✓' : '!'}
            </span>
            <span className="fcal-texto">
              <span className="fcal-titulo">{r.titulo}</span>
              <span className="fcal-pregunta">{r.pregunta}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="fcal-nota">
        Ninguna de las cinco la contesta la máquina sola: las cinco necesitan que alguien sepa de qué van los datos.
        Eso es lo que hace un analista, y es lo que no se puede automatizar.
      </p>
    </div>
  );
}

export default FichaDeCalidad;
