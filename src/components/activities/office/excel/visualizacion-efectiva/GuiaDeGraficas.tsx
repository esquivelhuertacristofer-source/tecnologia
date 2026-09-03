'use client';

import type { PanelDeClaseProps } from '@/components/office/VentanaHojas';
import {
  seArreglaLaGraficaDeLaSemifinal,
  seHizoColumnasDelResumen,
  seHizoLineasDeAsistencia,
  seHizoPastelDePresupuesto,
} from './guion';
import './guiaDeGraficas.css';

/**
 * «Qué gráfica usar» — el panel de clase de `n8-visualizacion-efectiva`.
 *
 * Mismo molde que `FichaDeCalidad.tsx` (`n8-limpieza-de-datos`): **no corrige
 * nada** —quien corrige es el guion, con sus predicados— y se enciende sola
 * leyendo el libro en vivo, reutilizando literalmente los mismos predicados
 * que cierran los encargos. Es un inventario de las cuatro reglas que la
 * clase enseña, no un cuarto corrector.
 *
 * Las cuatro reglas están en el orden en que la clase las demuestra —comparar,
 * tendencia, repartir un total, el eje cortado— y no en un orden alfabético
 * ni de dificultad: es el mismo orden que sigue `guion.ts`, para que marcar
 * una regla aquí coincida con haber cerrado el encargo de al lado.
 */
export function GuiaDeGraficas({ libro }: PanelDeClaseProps) {
  const reglas = [
    {
      id: 'comparar',
      titulo: 'Columnas o barras',
      pregunta: '¿Cuál es más grande? Categorías sueltas, sin orden entre ellas.',
      hecho: seHizoColumnasDelResumen(libro),
    },
    {
      id: 'tendencia',
      titulo: 'Líneas',
      pregunta: '¿Cómo cambió con el tiempo? Hace falta un camino real que seguir.',
      hecho: seHizoLineasDeAsistencia(libro),
    },
    {
      id: 'repartir',
      titulo: 'Pastel',
      pregunta: '¿Qué parte de un total? Pocas rebanadas, y que sumen ese total de verdad.',
      hecho: seHizoPastelDePresupuesto(libro),
    },
    {
      id: 'eje',
      titulo: 'El eje',
      pregunta: 'Antes de creerte la forma, mira dónde empieza la regla.',
      hecho: seArreglaLaGraficaDeLaSemifinal(libro),
    },
  ];
  const hechas = reglas.filter((r) => r.hecho).length;

  return (
    <div className="gdg">
      <p className="gdg-intro">Cada gráfica contesta una pregunta distinta. Se marca sola conforme la demuestras.</p>

      <p className="gdg-marcador">
        <b>
          {hechas} de {reglas.length}
        </b>
        <span>reglas demostradas</span>
      </p>

      <ul className="gdg-lista">
        {reglas.map((r) => (
          <li
            key={r.id}
            className="gdg-item"
            data-regla={r.id}
            data-hecho={r.hecho ? 'si' : 'no'}
            aria-label={`${r.titulo}: ${r.hecho ? 'demostrada' : 'pendiente'}`}
          >
            <span className="gdg-marca" aria-hidden>
              {r.hecho ? '✓' : '?'}
            </span>
            <span className="gdg-texto">
              <span className="gdg-titulo">{r.titulo}</span>
              <span className="gdg-pregunta">{r.pregunta}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="gdg-nota">
        No hay una gráfica «mejor» en general: hay una gráfica correcta para cada pregunta. Elegirla empieza por
        saber qué tipo de pregunta se está haciendo.
      </p>
    </div>
  );
}

export default GuiaDeGraficas;
