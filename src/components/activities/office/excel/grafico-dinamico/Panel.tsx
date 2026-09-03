'use client';

import { useMemo, useState } from 'react';
import type { PanelDeClaseProps } from '@/components/office/VentanaHojas';
import { hojaDe, type Grafica, type Segmentacion } from '@/components/office/motor-hojas/modelo';
import { leerDatos, lineaDeTendencia } from '@/components/office/motor-hojas/Grafica';
import PanelDinamica from '../comun/PanelDinamica';
import { dinamicaBajoSel } from '../comun/controlesDinamica';
import { CAMPO_MES, ID_GRAFICA, ID_SEGMENTACION, MESES } from './guion';
import './panelGraficoDinamico.css';

/**
 * El panel de `of-excel-grafico-dinamico` (bloques 51 y 52): `PanelDinamica`
 * de siempre —sin tocarle una línea, es el molde que dejó hecho
 * `of-excel-tabla-dinamica`— con cuatro secciones nuevas al lado, una por cada
 * herramienta de la clase. Las cuatro llaman al MISMO `gesto(control, valor)`
 * que llamaría un botón de la cinta, así que pasan por `revisar`, por la
 * grabadora y por el modo guía como cualquier otro (los seis controles que
 * pulsan viven en `controles.ts`, al lado).
 *
 * ── EL «N» DE LA TENDENCIA SE CALCULA AQUÍ, NO EN `Grafica.tsx` ─────────────
 *
 * El dibujo sólo pinta la recta —`data-tendencia`, sin texto—: es la mitad de
 * la lección de la clase 52, no del motor. `Grafica.tsx` deja `n` servido en
 * `Tendencia` para quien lo necesite (comentario de `modelo.ts`, junto a
 * `tendenciaSerie`), y este panel es quien lo necesita: sin verlo escrito, el
 * alumno no tiene manera de comparar «seis puntos» contra «cuatro puntos», que
 * es literalmente el encargo.
 */

function laGrafica(libro: PanelDeClaseProps['libro'], hoja: string): Grafica | null {
  return hojaDe(libro, hoja)?.graficas?.find((g) => g.id === ID_GRAFICA) ?? null;
}

function laSegmentacion(libro: PanelDeClaseProps['libro'], hoja: string): Segmentacion | null {
  return hojaDe(libro, hoja)?.segmentaciones?.find((s) => s.id === ID_SEGMENTACION) ?? null;
}

export function PanelGraficoDinamico(props: PanelDeClaseProps) {
  const { libro, motor, hoja, sel, gesto } = props;
  const din = dinamicaBajoSel({ motor, hoja, sel });
  const grafica = laGrafica(libro, hoja);
  const segmentacion = laSegmentacion(libro, hoja);
  const filtroActual = din?.filtros?.[CAMPO_MES] ?? [];
  const [corte, setCorte] = useState('');

  /*
   * `libro` va en las dependencias aunque el cuerpo no lo lea: es lo que
   * fuerza a recalcular `datos` cuando cambia la DINÁMICA (mover un campo,
   * filtrar, actualizar) sin que la propia `Grafica` cambie de referencia —
   * su `id` sigue siendo `g1`, y `laGrafica` la vuelve a encontrar en el
   * mismo sitio del array; lo que cambió es el objeto `Dinamica` de la que
   * lee `leerDatos`. Sin `libro` aquí, el panel se queda mostrando el
   * gráfico de antes del clic.
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const datos = useMemo(() => (grafica ? leerDatos(motor, hoja, grafica) : null), [grafica, motor, hoja, libro]);

  const alternarMes = (mes: string) => {
    const nuevo = filtroActual.includes(mes) ? filtroActual.filter((m) => m !== mes) : [...filtroActual, mes];
    gesto('filtrar-segmentacion', nuevo.join('|'));
  };

  return (
    <div className="pgd">
      <PanelDinamica {...props} />

      <section className="pdn-seccion">
        <h4>Gráfico dinámico</h4>
        <p className="pdn-ayuda">
          Un gráfico dinámico no lee celdas: lee la tabla dinámica. Cuando la dinámica se actualiza, el gráfico se mueve con ella
          —y sólo entonces.
        </p>
        {!grafica ? (
          <div className="pdn-fila">
            <button type="button" data-control="grafico-dinamico" disabled={!din} onClick={() => gesto('grafico-dinamico')}>
              Insertar gráfico de columnas
            </button>
          </div>
        ) : (
          <p className="pdn-ayuda">Gráfico insertado, sobre la tabla dinámica «{grafica.origenDinamica}».</p>
        )}
      </section>

      <section className="pdn-seccion">
        <h4>Segmentación · Mes</h4>
        <p className="pdn-ayuda">
          Filtra la dinámica y el gráfico a la vez. A diferencia de un filtro de tabla, aquí se VE qué está pulsado.
        </p>
        {!segmentacion ? (
          <div className="pdn-fila">
            <button type="button" data-control="segmentacion" disabled={!din} onClick={() => gesto('segmentacion')}>
              Insertar segmentación de Mes
            </button>
          </div>
        ) : (
          <>
            <div className="pgd-meses">
              {MESES.map((mes) => (
                <button
                  key={mes}
                  type="button"
                  data-control="filtrar-segmentacion"
                  data-mes={mes}
                  className={`pgd-mes${filtroActual.includes(mes) ? ' es-activo' : ''}`}
                  aria-pressed={filtroActual.includes(mes)}
                  onClick={() => alternarMes(mes)}
                >
                  {mes}
                </button>
              ))}
            </div>
            <div className="pdn-fila">
              <button
                type="button"
                data-control="quitar-filtro-segmentacion"
                disabled={filtroActual.length === 0}
                onClick={() => gesto('quitar-filtro-segmentacion')}
              >
                Ver los seis meses
              </button>
            </div>
          </>
        )}
      </section>

      {grafica && datos && datos.series.length > 0 && (
        <section className="pdn-seccion">
          <h4>Línea de tendencia</h4>
          <p className="pdn-ayuda">
            El motor traza la recta con los puntos que le des: decidir si son suficientes es trabajo tuyo, no del programa.
          </p>
          <ul className="pgd-series">
            {datos.series.map((s, i) => {
              const activa = grafica.tendenciaSerie === i;
              const t = lineaDeTendencia(
                s.puntos.map((_, k) => k),
                s.puntos,
              );
              return (
                <li key={s.nombre} className="pgd-serie">
                  <div className="pdn-fila">
                    <span className="pdn-campo-nombre">{s.nombre}</span>
                    <button
                      type="button"
                      data-control="linea-tendencia"
                      onClick={() => gesto('linea-tendencia', activa ? '' : i)}
                    >
                      {activa ? 'Quitar tendencia' : 'Trazar tendencia'}
                    </button>
                  </div>
                  {activa && (
                    <p className="pgd-n">
                      Trazada sobre <b>{t.n}</b> punto{t.n === 1 ? '' : 's'}.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {grafica && datos && datos.series.length > 1 && (
        <section className="pdn-seccion">
          <h4>Eje secundario</h4>
          <p className="pdn-ayuda">
            Cuando dos series tienen escalas muy distintas, una aplasta a la otra. Manda la más pequeña al segundo eje — y
            recuerda que cortarlo a mano también sirve para que dos curvas parezcan ir juntas sin estarlo.
          </p>
          <ul className="pgd-series">
            {datos.series.map((s, i) => {
              const enSecundario = !!grafica.ejeSecundario?.includes(i);
              return (
                <li key={s.nombre} className="pdn-fila">
                  <span className="pdn-campo-nombre">{s.nombre}</span>
                  <button
                    type="button"
                    data-control="eje-secundario"
                    onClick={() => gesto('eje-secundario', `${i}|${enSecundario ? 0 : 1}`)}
                  >
                    {enSecundario ? 'Quitar del segundo eje' : 'Mandar al segundo eje'}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="pdn-fila">
            <input
              aria-label="Cortar el segundo eje en"
              type="text"
              inputMode="numeric"
              placeholder="Cortar el segundo eje en…"
              value={corte}
              onChange={(e) => setCorte(e.target.value)}
            />
            <button type="button" data-control="eje-secundario-corte" onClick={() => gesto('eje-secundario-corte', corte.trim())}>
              Cortar
            </button>
            <button
              type="button"
              data-control="eje-secundario-corte"
              disabled={grafica.minYSecundario === undefined}
              onClick={() => {
                setCorte('');
                gesto('eje-secundario-corte', '');
              }}
            >
              Quitar corte
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default PanelGraficoDinamico;
