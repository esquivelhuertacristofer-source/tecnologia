'use client';

/**
 * El juez · `ventana/PanelJuez.tsx` — el tablero de Python, dentro de Tecnia
 * Código.
 *
 * Casi todo lo que hace está en `TableroJuez.tsx`, que no sabe de lenguajes.
 * Aquí sólo vive lo que es de Python: que el contrato es una **firma**, que un
 * ejemplo es una **llamada** con las líneas que tiene que imprimir, y quién
 * juzga.
 *
 * Se monta como el `panelFijo` de una `ClaseCodigo`, así que recibe
 * `{ ejecucion, texto, senalarLinea, revisar }`. **No sabe en qué encargo va el
 * alumno**, y eso resultó ser una ventaja: el problema activo se deriva del
 * tablero —el primero que no está aceptado—, que es exactamente el orden de los
 * encargos, y encima deja volver a mirar uno ya resuelto sin tocar el guion.
 */

import type { ComponentType } from 'react';
import type { PanelCodigoProps } from '../../codigo/ventana';
import type { Problema, Veredicto } from '../modelo';
import { juzgar } from '../juezPython';
import { crearTablero } from './TableroJuez';

export interface OpcionesPanelJuez {
  problemas: readonly Problema[];
  /** Se avisa al destapar una pista. `indice` 0, 1 o 2; la 2 es la que cuesta. */
  onPista?: (problemaId: string, indice: number) => void;
  /** Se avisa en cada envío, con el veredicto tachado. Para medir intentos. */
  onEnvio?: (veredicto: Veredicto) => void;
  /**
   * Lo que la clase quiera poner debajo del tablero. Ver `TableroJuez.tsx`.
   * Recibe los props COMPLETOS de un panel de Tecnia Código, `ejecucion`
   * incluida: el pie es de la clase, no del tablero.
   */
  pie?: ComponentType<PanelCodigoProps & { aceptados: readonly string[] }>;
}

export function crearPanelJuez({ problemas, onPista, onEnvio, pie }: OpcionesPanelJuez) {
  const Tablero = crearTablero<Problema, PanelCodigoProps>({
    problemas,
    etiquetaContrato: 'El juez va a llamar a',
    contrato: (p) => p.firma,
    ocultos: (p) => p.casos.filter((c) => c.oculto).length,
    juzgar,
    onPista,
    onEnvio,
    pie,
    ejemplos: (p) => (
      <ul>
        {p.casos
          .filter((c) => !c.oculto)
          .map((c) => (
            <li key={c.nombre}>
              <code className="jz-ej-llamada">{c.llamada}</code>
              <span className="jz-ej-flecha" aria-hidden="true">
                →
              </span>
              <span className="jz-ej-salida">
                {c.esperada.map((l, i) => (
                  <code key={i}>{l}</code>
                ))}
              </span>
            </li>
          ))}
      </ul>
    ),
  });

  /* El tablero ya está cortado a la medida de `PanelCodigoProps`: este
   * envoltorio existe sólo para que el componente tenga nombre propio en las
   * herramientas de React y en los mensajes de las pruebas. */
  function PanelJuez(props: PanelCodigoProps) {
    return <Tablero {...props} />;
  }

  return PanelJuez;
}
