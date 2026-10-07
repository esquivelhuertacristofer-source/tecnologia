'use client';

/**
 * El juez · `ventana/PanelJuezSql.tsx` — el mismo tablero, para Tecnia Datos.
 *
 * Lo que cambia respecto del de Python es lo que tenía que cambiar y nada más:
 *
 * - **El contrato son las columnas**, no una firma. En SQL el alumno no define
 *   nada con un nombre: devuelve una tabla, y lo que hay que pactar es qué
 *   columnas lleva y en qué orden. Los *nombres* de esas columnas no se
 *   juzgan —llamarle `total` o `cuantos` a lo mismo es correcto—; el número, sí.
 * - **Un ejemplo se enseña como tabla**, con sus filas, porque una respuesta de
 *   SQL son filas. Y si el orden importa, se dice: es la única forma de que el
 *   alumno sepa cuándo hace falta un `ORDER BY` de verdad y cuándo no.
 * - **Los datos de un caso oculto son OTRA siembra**, no otros argumentos. Eso
 *   es lo que tumba de raíz la trampa que la auditoría del 2-sep-2026 encontró
 *   en esta misma clase: un encargo que se aprobaba sin ordenar nada porque las
 *   filas ya estaban sembradas en orden alfabético.
 */

import type { ComponentType } from 'react';
import type { PanelDatosProps } from '../../datos/ventana';
import type { Veredicto } from '../modelo';
import { juzgarSql, type ProblemaSql } from '../juezSql';
import { crearTablero } from './TableroJuez';

export interface OpcionesPanelJuezSql {
  problemas: readonly ProblemaSql[];
  onPista?: (problemaId: string, indice: number) => void;
  onEnvio?: (veredicto: Veredicto) => void;
  /** Igual que en el de Python: el pie recibe los props completos de su armazón. */
  pie?: ComponentType<PanelDatosProps & { aceptados: readonly string[] }>;
}

/**
 * Cuántas filas del ejemplo se pintan antes de resumir el resto.
 *
 * Medido en Chromium el 12-sep-2026 con el problema 1: las doce filas del
 * ejemplo ocupaban 275 px de los 408 del bloque de ejemplos, y dejaban el botón
 * «Enviar al juez» a **942 px** del borde de arriba de una columna que sólo
 * enseña 544. Seis filas ya dicen las dos cosas que un ejemplo de SQL tiene que
 * decir —qué columnas y, cuando importa, en qué orden—; las otras seis sólo
 * alejaban el botón.
 */
const TOPE_FILAS_EJEMPLO = 6;

function celda(c: unknown): string {
  if (c === null || c === undefined) return '—';
  if (typeof c === 'boolean') return c ? 'sí' : 'no';
  return String(c);
}

export function crearPanelJuezSql({ problemas, onPista, onEnvio, pie }: OpcionesPanelJuezSql) {
  const Tablero = crearTablero<ProblemaSql, PanelDatosProps>({
    problemas,
    etiquetaContrato: 'El juez espera estas columnas',
    contrato: (p) => p.columnas,
    ocultos: (p) => p.casos.filter((c) => c.oculto).length,
    juzgar: juzgarSql,
    onPista,
    onEnvio,
    pie,
    ejemplos: (p) => (
      <ul className="jz-ej-sql">
        {p.casos
          .filter((c) => !c.oculto)
          .map((c) => (
            <li key={c.nombre}>
              <span className="jz-ej-nombre">
                {c.nombre}
                {c.ordenImporta && <b className="jz-ej-orden">el orden cuenta</b>}
              </span>
              <table className="jz-ej-tabla">
                <tbody>
                  {c.esperada.slice(0, TOPE_FILAS_EJEMPLO).map((fila, i) => (
                    <tr key={i}>
                      {fila.map((v, j) => (
                        <td key={j}>{celda(v)}</td>
                      ))}
                    </tr>
                  ))}
                  {c.esperada.length > TOPE_FILAS_EJEMPLO && (
                    <tr className="jz-ej-mas">
                      <td colSpan={c.esperada[0]?.length ?? 1}>
                        y {c.esperada.length - TOPE_FILAS_EJEMPLO} filas más
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </li>
          ))}
      </ul>
    ),
  });

  function PanelJuezSql(props: PanelDatosProps) {
    return <Tablero {...props} />;
  }

  return PanelJuezSql;
}
