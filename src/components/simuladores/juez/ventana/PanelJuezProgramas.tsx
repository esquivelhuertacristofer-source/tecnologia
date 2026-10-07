'use client';

/**
 * El juez · `ventana/PanelJuezProgramas.tsx` — el tablero para programas que
 * preguntan y contestan (§68.4), dentro de Tecnia Código.
 *
 * Tercer cliente de `TableroJuez.tsx`. Lo que es suyo:
 *
 * - **El contrato es lo que se lee**, en orden («tu edad · el año en que
 *   naciste»), no una firma.
 * - **Un ejemplo es lo que se teclea → lo que se imprime.**
 * - **Las fichas del manual**, por encargo: un programa de otro tema con la
 *   herramienta que hace falta. Ver `FichaManual` en `juezProgramas.ts`.
 * - **Convive con el panel de la clase.** Las clases de N7 mezclan problemas con
 *   encargos de exploración (provocar un error, ver al programa esperar). En
 *   esos encargos el tablero **se esconde sin desmontarse** —desmontarlo
 *   borraría los veredictos, que viven en su estado y en el registro que limpia
 *   al montarse— y aparece el panel propio de la clase con su ficha abierta.
 */

import type { ComponentType } from 'react';
import type { PanelCodigoProps } from '../../codigo/ventana';
import type { Veredicto } from '../modelo';
import { juzgarPrograma, type FichaManual, type ProblemaPrograma } from '../juezProgramas';
import { crearTablero } from './TableroJuez';

export interface OpcionesPanelJuezProgramas {
  problemas: readonly ProblemaPrograma[];
  /** Fichas del manual por id de encargo: de problemas y de encargos de exploración. */
  manual?: Readonly<Record<string, FichaManual>>;
  /** El panel propio de la clase, para los encargos que no son problemas. */
  fuera?: ComponentType<PanelCodigoProps>;
  /**
   * Encargos que no son problemas pero se cumplen volviendo a enviar uno
   * («arréglalo y mándalo otra vez al juez»): id del encargo → id del problema.
   * En ellos se ve el tablero de ESE problema. Sin esto el tablero quedaba
   * escondido y el botón de enviar, invisible (quinta puerta de
   * `n6-primeras-lineas-python`, 6-oct-2026; jsdom pulsa botones escondidos).
   */
  vuelven?: Readonly<Record<string, string>>;
  /** Debajo del tablero, en los problemas (ver `pie` en `TableroJuez.tsx`): p. ej. el Semáforo de §68.5. */
  pie?: ComponentType<PanelCodigoProps & { aceptados: readonly string[] }>;
  onPista?: (problemaId: string, indice: number) => void;
  onEnvio?: (veredicto: Veredicto) => void;
}

/**
 * Código en una columna de 300 px. Medido en Chromium el 12-sep-2026: con
 * `<pre>` la primera línea de la ficha se cortaba en «¿Cómo se llama tu m» y
 * el resto quedaba detrás de una barra de desplazamiento que nadie mueve. Cada
 * línea es un bloque que se parte con **sangría colgante**: lo que sigue de una
 * línea partida entra más adentro, y no se confunde con una línea nueva.
 */
function Lineas({ clase, lineas }: { clase: string; lineas: readonly string[] }) {
  return (
    <div className={`jz-manual-codigo ${clase}`}>
      {lineas.map((l, i) => (
        <code key={i}>{l === '' ? ' ' : l}</code>
      ))}
    </div>
  );
}

/** Una ficha del manual. Plegada dentro del tablero, abierta fuera de él. */
export function FichaDelManual({ ficha, abierta }: { ficha: FichaManual; abierta: boolean }) {
  return (
    <details className="jz-manual" open={abierta} data-testid="jz-manual">
      <summary>
        <span className="jz-manual-rotulo">Del manual</span>
        {ficha.titulo}
      </summary>
      <div className="jz-manual-cuerpo">
        {Object.entries(ficha.archivos ?? {}).map(([nombre, texto]) => (
          <div key={nombre} className="jz-manual-archivo" data-testid="jz-manual-archivo">
            <p className="jz-manual-consola-rotulo">
              <b>{nombre.endsWith('.py') ? '🐍' : '📄'} {nombre}</b>
            </p>
            <Lineas clase="jz-manual-programa" lineas={texto.replace(/\n$/, '').split('\n')} />
          </div>
        ))}
        {ficha.archivos && (
          <p className="jz-manual-consola-rotulo">
            <b>El programa</b>
          </p>
        )}
        <Lineas clase="jz-manual-programa" lineas={ficha.programa} />
        {ficha.tecleado.length > 0 && (
          <p className="jz-manual-tecleado">
            <b>Se contestó</b>
            {ficha.tecleado.map((t, i) => (
              <code key={i}>{t}</code>
            ))}
          </p>
        )}
        <p className="jz-manual-consola-rotulo">
          <b>Así queda la consola</b>
        </p>
        <Lineas clase="jz-manual-consola" lineas={ficha.consola} />
        <p className="jz-manual-nota">{ficha.nota}</p>
      </div>
    </details>
  );
}

export function crearPanelJuezProgramas({
  problemas,
  manual,
  fuera: Fuera,
  vuelven,
  pie,
  onPista,
  onEnvio,
}: OpcionesPanelJuezProgramas) {
  const ids = new Set(problemas.map((p) => p.id));

  const Tablero = crearTablero<ProblemaPrograma, PanelCodigoProps>({
    problemas,
    etiquetaContrato: (p) => (p.lee.length > 0 ? 'Tu programa lee, en este orden' : 'Tu programa trabaja con'),
    contrato: (p) =>
      p.lee.length > 0
        ? p.lee.join(' · ')
        : p.datos
          ? `${p.datos.join(', ')} · el juez los cambia en cada caso`
          : p.archivos
            ? `${p.archivos.join(', ')} · el juez ${p.archivos.length === 1 ? 'lo' : 'los'} cambia en cada caso`
            : 'nada por teclado',
    ocultos: (p) => p.casos.filter((c) => c.oculto).length,
    juzgar: (p, texto, props) => juzgarPrograma(p, texto, props.proyecto),
    onPista,
    onEnvio,
    pie,
    ejemplos: (p) => (
      <>
        <ul>
          {p.casos
            .filter((c) => !c.oculto)
            .map((c) => (
              <li key={c.nombre}>
                {c.archivos ? (
                  <span className="jz-ej-teclea" data-testid="jz-ej-archivos">
                    {Object.keys(c.archivos).map((n) => (
                      <code key={n}>📄 {n} (el de tu proyecto)</code>
                    ))}
                  </span>
                ) : c.datos ? (
                  <span className="jz-ej-teclea" data-testid="jz-ej-datos">
                    {Object.entries(c.datos).map(([n, v]) => (
                      <code key={n}>
                        {n} = {v}
                      </code>
                    ))}
                  </span>
                ) : (
                  <span className="jz-ej-teclea">
                    <span aria-label="se teclea">⌨</span>
                    {c.entradas.map((t, i) => (
                      <code key={i}>{t}</code>
                    ))}
                  </span>
                )}
                <span className="jz-ej-flecha" aria-hidden="true">
                  →
                </span>
                <span className="jz-ej-salida">
                  {c.esperada.map((l, i) => (
                    <code key={i}>{l}</code>
                  ))}
                  {Object.entries(c.escribe ?? {}).map(([n, lineas]) => (
                    <span key={n} className="jz-ej-escribe" data-testid="jz-ej-escribe">
                      <b>y en {n}:</b>
                      {lineas.map((l, i) => (
                        <code key={i}>{l}</code>
                      ))}
                    </span>
                  ))}
                </span>
              </li>
            ))}
        </ul>
        <p className="jz-nota-teclado">
          {p.archivos ? (
            <>
              El juez cambia {p.archivos.join(', ')} por {p.archivos.length === 1 ? 'el' : 'los'} de cada caso y compara lo que tu
              programa imprime con <b>print</b>
              {p.casos.some((c) => c.escribe) ? ' y lo que deja escrito en sus archivos' : ''}. Lo que funciona con el archivo de tu
              proyecto puede no funcionar con otro.
            </>
          ) : p.datos ? (
            <>
              El juez cambia los datos de arriba de la celda por los de cada caso y compara lo que tu programa imprime con{' '}
              <b>print</b>. Escribir el resultado a mano sólo sirve para un caso.
            </>
          ) : (
            <>
              El juez teclea estos datos por ti y compara sólo lo que tu programa imprime con <b>print</b>. El texto de tus
              preguntas es libre.
            </>
          )}
        </p>
      </>
    ),
    manual: (p) => (manual?.[p.id] ? <FichaDelManual ficha={manual[p.id]} abierta={false} /> : null),
  });

  function PanelJuezProgramas(props: PanelCodigoProps) {
    const { encargoId } = props;
    const vuelveA = encargoId ? vuelven?.[encargoId] : undefined;
    /* Sin encargo (clase terminada, o panel pintado suelto en una prueba) se
     * enseña el tablero: es el resumen de lo que se envió. */
    const verTablero = !encargoId || ids.has(encargoId) || vuelveA !== undefined;
    const ficha = encargoId && !verTablero ? manual?.[encargoId] : undefined;
    return (
      <>
        <div hidden={!verTablero}>
          <Tablero {...props} encargoId={vuelveA ?? encargoId} />
        </div>
        {!verTablero && (
          <div className="jz" data-testid="jz-fuera">
            {ficha && <FichaDelManual ficha={ficha} abierta />}
            {Fuera && <Fuera {...props} />}
          </div>
        )}
      </>
    );
  }

  return PanelJuezProgramas;
}
