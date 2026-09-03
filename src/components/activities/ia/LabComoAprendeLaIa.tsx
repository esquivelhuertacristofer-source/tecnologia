'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  brechaDe,
  entrenar,
  evaluar,
  examinar,
  informeDe,
  repartir,
  type Examen,
  type Regla,
} from '@/components/simuladores/aprendizaje';
import { PortadaIA, type DatosPortadaIA } from './PortadaIA';
import {
  ACTA_ABRIL,
  AUTORES,
  AUTOR_CORRECTO,
  CAUSAS,
  CAUSA_CORRECTA,
  COLUMNAS,
  ESQUEMA,
  LECTURAS_DEL_EXAMEN,
  LECTURA_CORRECTA,
  LINEAS,
  LOTES_REFUERZO,
  LOTE_ABRIL,
  LOTE_CAMPO,
  LOTE_CORRECTO,
  NOMBRE_CONTENEDOR,
  NOMBRE_MATERIAL,
  PARTE_DE_PRUEBA,
  PENALIZACION,
  PRONOSTICOS,
  PRONOSTICO_CORRECTO,
  SEMILLA_REPARTO,
  TOPE_MEMORIA,
  TOTAL_PASOS,
  contenedorReal,
  type Contenedor,
  type Material,
} from './loteAcopio';
import './salaIA.css';
import './comoAprendeLaIa.css';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N7 · U6 «IA I», parada 1 · `n7-como-aprende-la-ia`
 * 1.º de secundaria · 12–13 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * **La consola del Comité de Acopio.** El alumno no etiqueta fichas: responde
 * por un conjunto de datos que ya existe. Nueve encargos, y el orden es la
 * clase:
 *
 *  1–2 · **Qué es un ejemplo.** Rasgos (*features*) más etiqueta (*label*), y
 *        la etiqueta la escribió a mano una persona. De ahí sale todo.
 *  3   · **La auditoría antes de entrenar.** El hueco se ve sin entrenar nada:
 *        el esquema declara cuatro materiales y el lote trae tres.
 *  4   · **El reparto.** El alumno corre las dos versiones —examinar con las
 *        mismas 28 y apartar 1 de cada 4— y las dos dan 100 %. La segunda es un
 *        examen de verdad… y **hereda el hueco de los datos**, que es la idea
 *        más dura de la clase.
 *  5–6 · **Leer el modelo.** Qué regla es memoria y no aprendizaje, y por dónde
 *        se va a romper, **sabido antes de probar** (`informe.ciegos`).
 *  7–8 · **La prueba de campo.** 70 % de acierto y una brecha de 1,00: un grupo
 *        entero al cero. Y la causa está en el acta, no en el código.
 *  9   · **Los tres lotes.** El más grande no es el bueno, y el único que trae
 *        de todo empeora el modelo porque sus etiquetas están mal.
 *
 * ── Lo que se cuidó, y por qué ────────────────────────────────────────────
 *
 * 1. **Ningún encargo posterior deshace un predicado anterior.** La bitácora
 *    sólo crece; la auditoría del encargo 3 sigue siendo verdad en el 9; el
 *    árbol que se lee en el 5 es exactamente el que se prueba en el 7.
 * 2. **Las respuestas correctas se calculan, no se escriben a mano.** La regla
 *    marcada como memoria sale de `informeDe(...).memorizadas` y el grupo roto
 *    sale de `brechaDe(...)`. Si el reparto cambiara, la clase seguiría siendo
 *    coherente en vez de mentir.
 * 3. **Explorar no cuesta.** Las dos corridas del encargo 4 y las tres pruebas
 *    de lote del 9 son mediciones, no respuestas: no restan. Lo que resta es la
 *    conclusión que se saca de ellas.
 * 4. **Los avisos salen del gesto**, nunca de dentro del actualizador de un
 *    `setState`: en modo estricto React invoca el actualizador dos veces y el
 *    progreso se iría al doble.
 * 5. **Ni un `Math.random()` ni un `Date.now()` en la lógica.** El reparto lleva
 *    semilla constante; el reloj sólo se lee para el tiempo de `terminar()`.
 */

type IdLote = (typeof LOTES_REFUERZO)[number]['id'];

interface Corrida {
  id: string;
  tono: 'mentira' | 'normal' | 'campo';
  texto: string;
  cifra: string;
}

interface ResultadoLote {
  id: IdLote;
  examen: Examen;
  brecha: number;
}

const pct = (x: number) => `${Math.round(x * 100)} %`;
const dosDec = (x: number) => x.toFixed(2).replace('.', ',');

/** Cómo se lee un valor de rasgo en pantalla. La UI no inventa rótulos. */
function leerValor(rasgo: string, valor: string): string {
  if (rasgo === 'material') return NOMBRE_MATERIAL[valor as Material] ?? valor;
  return valor;
}

/** Una regla del árbol, en castellano. Se compone del `si` que trae el informe. */
function leerRegla(regla: Regla): string {
  if (regla.si.length === 0) return 'siempre';
  return regla.si.map((c) => `${c.rasgo} = ${leerValor(c.rasgo, c.valor)}`).join(' y ');
}

export function LabComoAprendeLaIa(props: ActivityProps & { alSalir?: () => void }) {
  const lab = useLabActividad(props, TOTAL_PASOS, { penalizacionError: PENALIZACION });
  const { linea, hablar } = useBit();

  const [fase, setFase] = useState<'portada' | 'trabajo'>('portada');
  const [encargo, setEncargo] = useState(0);
  const [senalado, setSenalado] = useState<string | null>(null);
  const [veredicto, setVeredicto] = useState<{ bien: boolean; texto: string } | null>(null);
  const [corridas, setCorridas] = useState<Corrida[]>([]);
  const [lotesProbados, setLotesProbados] = useState<IdLote[]>([]);

  /* Un encargo se resuelve una sola vez. El botón que lo resuelve se desmonta
   * al avanzar, así que un doble clic normalmente no llega — pero eso es una
   * casualidad del montaje, no una garantía, y la garantía va aquí. */
  const resueltos = useRef<Set<number>>(new Set());

  // ── El motor, entero, en memos puros ────────────────────────────────────
  const auditoria = useMemo(() => examinar(ESQUEMA, LOTE_ABRIL), []);
  const reparto = useMemo(
    () =>
      repartir(LOTE_ABRIL, {
        prueba: PARTE_DE_PRUEBA,
        semilla: SEMILLA_REPARTO,
        estratificar: true,
      }),
    [],
  );
  const modelo = useMemo(() => entrenar(ESQUEMA, reparto.entrenamiento), [reparto]);
  const informe = useMemo(() => informeDe(modelo, { memoria: TOPE_MEMORIA }), [modelo]);
  const examenApartado = useMemo(() => evaluar(modelo, reparto.prueba), [modelo, reparto]);
  const examenMismas = useMemo(() => {
    const m = entrenar(ESQUEMA, LOTE_ABRIL);
    return evaluar(m, LOTE_ABRIL);
  }, []);
  const examenCampo = useMemo(() => evaluar(modelo, LOTE_CAMPO), [modelo]);
  const brechaCampo = useMemo(() => brechaDe(examenCampo, 'material'), [examenCampo]);

  const resultadosLotes = useMemo<ResultadoLote[]>(
    () =>
      LOTES_REFUERZO.map((lote) => {
        const m = entrenar(ESQUEMA, [...reparto.entrenamiento, ...lote.fichas]);
        const ex = evaluar(m, LOTE_CAMPO);
        return { id: lote.id, examen: ex, brecha: brechaDe(ex, 'material').diferencia };
      }),
    [reparto],
  );

  /**
   * Los nodos que el informe marca como memoria. **Calculado, no escrito.**
   *
   * El respaldo no es adorno: si un día el reparto cambiara y ninguna regla
   * quedara marcada, este encargo se quedaría **sin respuesta correcta** y la
   * clase sería imposible de terminar con las pruebas unitarias en verde. Ya
   * pasó en el proyecto (nueve clases así en Excel), así que la respuesta
   * siempre existe: a falta de marca, la regla de menor apoyo.
   */
  const nodosMemoria = useMemo(() => {
    if (informe.memorizadas.length > 0) return new Set(informe.memorizadas.map((r) => r.nodo));
    if (informe.reglas.length === 0) return new Set<string>();
    const minimo = Math.min(...informe.reglas.map((r) => r.apoyo.length));
    return new Set(informe.reglas.filter((r) => r.apoyo.length === minimo).map((r) => r.nodo));
  }, [informe]);
  /** El grupo donde el modelo no funciona. También calculado. */
  const grupoRoto = brechaCampo.peor?.valor ?? null;

  const anotar = useCallback((corrida: Corrida) => {
    setCorridas((previas) =>
      previas.some((c) => c.id === corrida.id) ? previas : [...previas, corrida],
    );
  }, []);

  const corrida = useCallback((id: string) => corridas.some((c) => c.id === id), [corridas]);

  // ── Resolver un encargo. El aviso sale de aquí, del gesto. ──────────────
  const resolver = useCallback(
    (bien: boolean, texto: string) => {
      if (bien) {
        if (resueltos.current.has(encargo)) return;
        resueltos.current.add(encargo);
        setVeredicto({ bien: true, texto });
        hablar(texto);
        const hechos = lab.avanzar();
        if (hechos >= TOTAL_PASOS) {
          lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000), () =>
            hablar(LINEAS.cierre),
          );
          return;
        }
        /*
         * `setVeredicto(null)` al avanzar (1-sep-2026). Sin esta línea, el texto
         * de retroalimentación del encargo que se acaba de resolver se quedaba
         * pegado en pantalla encima del enunciado del encargo SIGUIENTE, hasta
         * que el alumno contestaba otra cosa — parecía que la pregunta nueva ya
         * tenía respuesta dada. Es el mismo defecto que se corrigió en
         * `LabEticaDeLaIa.tsx` (`cerrarEncargo`), la tercera copia de este mismo
         * armazón: se arregló allí y no aquí. El acierto se sigue comunicando
         * por voz (`hablar(texto)`) y por el contador que avanza; el veredicto
         * visible queda reservado para el fallo, que es el que NO avanza.
         */
        setSenalado(null);
        setVeredicto(null);
        setEncargo(hechos);
        return;
      }
      setVeredicto({ bien: false, texto });
      hablar(texto);
      lab.restar();
    },
    [encargo, hablar, lab],
  );

  const empezar = useCallback(() => {
    setFase('trabajo');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const repetir = useCallback(() => {
    resueltos.current = new Set();
    setEncargo(0);
    setSenalado(null);
    setVeredicto(null);
    setCorridas([]);
    setLotesProbados([]);
    lab.reiniciar(() => hablar(LINEAS.inicio));
  }, [hablar, lab]);

  // ── Los paneles de cada encargo ─────────────────────────────────────────

  const consigna = [
    'Dos de estas columnas son rasgos: lo que el sensor de la banda mide solo. Una es la etiqueta: la respuesta que el modelo tendrá que dar. Señálala.',
    'La columna «contenedor» no la midió ningún sensor. ¿De dónde salió?',
    'Antes de entrenar nada, mira el recuento por material. Señala el grupo del que el lote no trae ni un ejemplo.',
    'Corre las dos formas de examinar. Cuando las dos estén en la bitácora, contesta.',
    'Éste es el modelo entero: cinco reglas. Al lado de cada una va cuántas fichas del montón de estudio la sostienen. Señala la que el informe marca como memoria.',
    'El informe dice por dónde se rompe el modelo sin haber probado nada. Señala lo que sostiene.',
    'Llegó la semana real: 20 envases, y esta vez sí hay tetrapak. Señala en el boletín el grupo donde el modelo no funciona.',
    'La brecha es de 1,00 y nadie escribió una sola regla a mano. Lee el acta y señala la causa.',
    'Prueba los tres lotes contra la semana real. Después elige cuál entra al conjunto definitivo.',
  ][encargo];

  const panel = () => {
    switch (encargo) {
      // ── E1 · qué columna es la etiqueta ──────────────────────────────────
      case 0:
        return (
          <div className="cai-tabla-caja">
            <table className="cai-tabla" aria-label="Lote de abril, primeras seis fichas">
              <thead>
                <tr>
                  {COLUMNAS.map((col) => (
                    <th key={col.id} scope="col">
                      <button
                        type="button"
                        className={`cai-cabecera${senalado === col.id ? ' es-etiqueta' : ''}`}
                        data-testid={`cai-col-${col.id}`}
                        onClick={() => {
                          setSenalado(col.id);
                          resolver(col.esEtiqueta, col.esEtiqueta ? LINEAS.e1_bien : LINEAS.e1_mal);
                        }}
                      >
                        {col.titulo}
                        <span className="cai-cabecera-nota">
                          {col.esEtiqueta ? 'la escribió alguien' : 'lo mide el sensor'}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LOTE_ABRIL.slice(0, 6).map((e) => (
                  <tr key={e.id}>
                    <td>{leerValor('material', e.rasgos.material)}</td>
                    <td>{e.rasgos.estado}</td>
                    <td>{NOMBRE_CONTENEDOR[e.etiqueta as Contenedor]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="cai-mas">…y {LOTE_ABRIL.length - 6} fichas más, hasta 28.</p>
          </div>
        );

      // ── E2 · quién escribió la etiqueta ──────────────────────────────────
      case 1:
        return (
          <div className="cai-opciones">
            {AUTORES.map((op) => (
              <button
                key={op.id}
                type="button"
                className={`cai-opcion${senalado === op.id ? ' es-senalada' : ''}`}
                data-testid={`cai-autor-${op.id}`}
                onClick={() => {
                  setSenalado(op.id);
                  const bien = op.id === AUTOR_CORRECTO;
                  resolver(bien, bien ? LINEAS.e2_bien : LINEAS.e2_mal);
                }}
              >
                {op.texto}
              </button>
            ))}
          </div>
        );

      // ── E3 · la auditoría, antes de entrenar ─────────────────────────────
      case 2: {
        const cuentas = auditoria.porRasgo.material ?? {};
        const mayor = Math.max(1, ...Object.values(cuentas));
        return (
          <div className="cai-recuento">
            {ESQUEMA.rasgos[0].valores.map((valor) => {
              const cuantos = cuentas[valor] ?? 0;
              const hueco = cuantos === 0;
              return (
                <button
                  key={valor}
                  type="button"
                  className={`cai-barra${hueco ? ' es-hueco' : ''}${senalado === valor ? ' es-senalada' : ''}`}
                  data-testid={`cai-barra-${valor}`}
                  onClick={() => {
                    setSenalado(valor);
                    resolver(hueco, hueco ? LINEAS.e3_bien : LINEAS.e3_mal);
                  }}
                >
                  <span
                    className="cai-barra-torre"
                    style={hueco ? undefined : { height: `${Math.round((cuantos / mayor) * 84)}px` }}
                  >
                    {hueco ? '0' : ''}
                  </span>
                  <span className="cai-barra-pie">
                    <span className="cai-barra-cuenta">{cuantos}</span>
                    {leerValor('material', valor)}
                  </span>
                </button>
              );
            })}
          </div>
        );
      }

      // ── E4 · el reparto ──────────────────────────────────────────────────
      case 3: {
        const listas = corrida('mismas') && corrida('apartado');
        return (
          <>
            <div className="cai-lote-botones">
              <button
                type="button"
                className="tia-boton es-fantasma"
                data-testid="cai-correr-mismas"
                disabled={corrida('mismas')}
                onClick={() => {
                  anotar({
                    id: 'mismas',
                    tono: 'mentira',
                    texto: `Examinar con las mismas ${LOTE_ABRIL.length} fichas`,
                    cifra: pct(examenMismas.acierto),
                  });
                  hablar(LINEAS.e4_mismas);
                }}
              >
                Examinar con las mismas {LOTE_ABRIL.length}
              </button>
              <button
                type="button"
                className="tia-boton"
                data-testid="cai-correr-apartado"
                disabled={corrida('apartado')}
                onClick={() => {
                  anotar({
                    id: 'apartado',
                    tono: 'normal',
                    texto: `Entrenar con ${reparto.entrenamiento.length}, examinar con ${reparto.prueba.length} apartadas`,
                    cifra: pct(examenApartado.acierto),
                  });
                  hablar(LINEAS.e4_apartado);
                }}
              >
                Apartar 1 de cada 4
              </button>
            </div>
            {listas ? (
              <div className="cai-opciones" data-testid="cai-lecturas">
                <p className="cai-consigna">
                  Los dos exámenes dan <b>{pct(examenApartado.acierto)}</b>. ¿Qué es lo único que
                  puede medir el examen apartado?
                </p>
                {LECTURAS_DEL_EXAMEN.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    className={`cai-opcion${senalado === op.id ? ' es-senalada' : ''}`}
                    data-testid={`cai-lectura-${op.id}`}
                    onClick={() => {
                      setSenalado(op.id);
                      const bien = op.id === LECTURA_CORRECTA;
                      resolver(bien, bien ? LINEAS.e4_bien : LINEAS.e4_mal);
                    }}
                  >
                    {op.texto}
                  </button>
                ))}
              </div>
            ) : (
              <p className="tia-nota">
                Faltan corridas. La pregunta aparece cuando las <b>dos</b> estén anotadas: la
                comparación es lo que se pregunta.
              </p>
            )}
          </>
        );
      }

      // ── E5 · leer el modelo ──────────────────────────────────────────────
      case 4:
        return (
          <div className="cai-reglas">
            {informe.reglas.map((regla) => {
              const esMemoria = nodosMemoria.has(regla.nodo);
              return (
                <button
                  key={regla.nodo}
                  type="button"
                  className={`cai-regla${senalado === regla.nodo ? ' es-senalada' : ''}`}
                  data-testid={`cai-regla-${regla.nodo}`}
                  onClick={() => {
                    setSenalado(regla.nodo);
                    resolver(esMemoria, esMemoria ? LINEAS.e5_bien : LINEAS.e5_mal);
                  }}
                >
                  <span className="cai-regla-si">
                    si <b>{leerRegla(regla)}</b>
                  </span>
                  <span className="cai-regla-entonces">
                    → {NOMBRE_CONTENEDOR[regla.entonces as Contenedor]}
                  </span>
                  <span className={`cai-regla-apoyo${esMemoria ? ' es-memoria' : ''}`}>
                    {regla.apoyo.length}{' '}
                    {regla.apoyo.length === 1 ? 'ficha' : 'fichas'}
                  </span>
                </button>
              );
            })}
          </div>
        );

      // ── E6 · el punto ciego, antes de probar ─────────────────────────────
      case 5: {
        const ciego = informe.ciegos[0];
        return (
          <>
            {ciego && (
              <p className="cai-ciego" data-testid="cai-ciego">
                Punto ciego · la pregunta <b>{ciego.rasgo}</b> no tiene rama para{' '}
                <b>{leerValor(ciego.rasgo, ciego.valor)}</b>. Apoyo de la respuesta de emergencia:{' '}
                <b>{ciego.apoyo} fichas</b>.
              </p>
            )}
            <div className="cai-opciones">
              {PRONOSTICOS.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  className={`cai-opcion${senalado === op.id ? ' es-senalada' : ''}`}
                  data-testid={`cai-pronostico-${op.id}`}
                  onClick={() => {
                    setSenalado(op.id);
                    const bien = op.id === PRONOSTICO_CORRECTO;
                    resolver(bien, bien ? LINEAS.e6_bien : LINEAS.e6_mal);
                  }}
                >
                  {op.texto}
                </button>
              ))}
            </div>
          </>
        );
      }

      // ── E7 · la prueba de campo ──────────────────────────────────────────
      case 6:
        return (
          <>
            <div className="cai-marcadores">
              <div className="cai-marcador">
                <span>Acierto en la semana real</span>
                <strong data-testid="cai-acierto-campo">{pct(examenCampo.acierto)}</strong>
              </div>
              <div className="cai-marcador es-alarma">
                <span>Veces que se quedó sin rama</span>
                <strong>{examenCampo.atascos}</strong>
              </div>
            </div>
            <div className="cai-boletin">
              {brechaCampo.grupos.map((g) => (
                <button
                  key={g.valor}
                  type="button"
                  className={`cai-fila${senalado === g.valor ? ' es-senalada' : ''}`}
                  data-testid={`cai-grupo-${g.valor}`}
                  onClick={() => {
                    setSenalado(g.valor);
                    const bien = g.valor === grupoRoto;
                    resolver(bien, bien ? LINEAS.e7_bien : LINEAS.e7_mal);
                  }}
                >
                  <span>{leerValor('material', g.valor)}</span>
                  <span className="cai-riel">
                    <span
                      className={`cai-relleno${g.aciertos === 0 ? ' es-cero' : ''}`}
                      style={{ width: `${Math.max(g.aciertos === 0 ? 4 : 0, g.acierto * 100)}%` }}
                    />
                  </span>
                  <span className="cai-fila-cifra">
                    {g.aciertos}/{g.total}
                  </span>
                </button>
              ))}
            </div>
          </>
        );

      // ── E8 · quién programó el sesgo ─────────────────────────────────────
      case 7:
        return (
          <>
            <div className="cai-marcadores">
              <div className="cai-marcador">
                <span>Acierto total</span>
                <strong>{pct(examenCampo.acierto)}</strong>
              </div>
              <div className="cai-marcador es-alarma">
                <span>Brecha entre grupos</span>
                <strong data-testid="cai-brecha">{dosDec(brechaCampo.diferencia)}</strong>
              </div>
            </div>
            <div className="cai-opciones">
              {CAUSAS.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  className={`cai-opcion${senalado === op.id ? ' es-senalada' : ''}`}
                  data-testid={`cai-causa-${op.id}`}
                  onClick={() => {
                    setSenalado(op.id);
                    const bien = op.id === CAUSA_CORRECTA;
                    resolver(bien, bien ? LINEAS.e8_bien : LINEAS.e8_mal);
                  }}
                >
                  {op.texto}
                </button>
              ))}
            </div>
          </>
        );

      // ── E9 · los tres lotes ──────────────────────────────────────────────
      default: {
        const todosProbados = lotesProbados.length === LOTES_REFUERZO.length;
        return (
          <div className="cai-lotes">
            {LOTES_REFUERZO.map((lote) => {
              const res = resultadosLotes.find((r) => r.id === lote.id);
              const probado = lotesProbados.includes(lote.id);
              return (
                <div key={lote.id} className={`cai-lote${probado ? ' es-probado' : ''}`}>
                  <p className="cai-lote-nombre">{lote.nombre}</p>
                  <p className="cai-lote-reclamo">{lote.reclamo}</p>
                  {probado && res && (
                    <p className="cai-lote-cifras" data-testid={`cai-cifras-${lote.id}`}>
                      <span>campo {pct(res.examen.acierto)}</span>
                      <span>brecha {dosDec(res.brecha)}</span>
                    </p>
                  )}
                  <div className="cai-lote-botones">
                    <button
                      type="button"
                      className="tia-boton es-fantasma"
                      data-testid={`cai-probar-${lote.id}`}
                      disabled={probado}
                      onClick={() => {
                        setLotesProbados((previos) =>
                          previos.includes(lote.id) ? previos : [...previos, lote.id],
                        );
                        if (res) {
                          anotar({
                            id: `lote-${lote.id}`,
                            tono: 'campo',
                            texto: `${lote.nombre} · brecha ${dosDec(res.brecha)}`,
                            cifra: pct(res.examen.acierto),
                          });
                        }
                        hablar(LINEAS[`e9_${lote.id}`]);
                      }}
                    >
                      Probar
                    </button>
                    <button
                      type="button"
                      className="tia-boton"
                      data-testid={`cai-elegir-${lote.id}`}
                      disabled={!todosProbados}
                      onClick={() => {
                        setSenalado(lote.id);
                        const bien = lote.id === LOTE_CORRECTO;
                        resolver(bien, bien ? LINEAS.e9_bien : LINEAS.e9_mal);
                      }}
                    >
                      Elegir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
    }
  };

  // ── La portada de objetivos, obligatoria al entrar ──────────────────────
  const portada: DatosPortadaIA = {
    situacion:
      'El colegio instala una banda separadora de basura. El programa no se escribe: se entrena.',
    tema: '¿Cómo aprende una IA?',
    objetivo:
      'Auditar un conjunto de datos de entrenamiento, medir lo que el modelo aprendió y demostrar que un sesgo puede colarse sin que nadie lo programe.',
    vasAHacer: [
      'Separar los rasgos de la etiqueta y averiguar quién escribió la etiqueta.',
      'Auditar las 28 fichas de abril antes de entrenar nada.',
      'Repartir en estudio y examen, y entender qué mide ese examen y qué no.',
      'Leer el modelo: qué memorizó y por dónde se va a romper.',
      'Probarlo contra la semana real y medir la brecha entre grupos.',
      'Elegir, entre tres lotes de datos nuevos, el que arregla el modelo.',
    ],
    encargos: TOTAL_PASOS,
    minutos: 20,
    insignia: { nombre: 'Responsable de datos', emoji: '🧪' },
    boton: 'Abrir Tecnia Entrena',
    acento: '#22d3ee',
  };

  return (
    <div className="tia-sala">
      <ArcadeSala
        titulo="¿Cómo aprende una IA?"
        pasoEtiqueta="Encargo"
        pasoActual={lab.terminado ? TOTAL_PASOS : lab.pasos}
        pasosTotal={TOTAL_PASOS}
        marcadorEtiqueta="Bitácora"
        marcadorValor={`${corridas.length}`}
        bit={fase === 'portada' || lab.terminado ? null : linea}
        alSalir={props.alSalir}
        final={
          lab.terminado
            ? {
                insigniaNombre: 'Responsable de datos',
                insigniaEmoji: '🧪',
                titulo:
                  lab.erroresFinal === 0
                    ? 'Conjunto cerrado sin un solo error de criterio'
                    : 'Conjunto cerrado. El sesgo estaba en el acta, no en el código',
                detalle:
                  'Un modelo no puede saber más de lo que hay en sus datos, y su examen tampoco: el examen apartado salió del mismo montón, así que heredó su hueco y te dio un 100 % que no valía. Sólo la semana real enseñó la brecha. Y el arreglo no fue traer más datos —el lote de 40 latas no movió nada y el de 40 mal etiquetadas empeoró el modelo—, sino traer los ocho que faltaban.',
                resumen: [
                  { etiqueta: 'Fichas auditadas', valor: `${LOTE_ABRIL.length}` },
                  { etiqueta: 'Corridas', valor: `${corridas.length}` },
                  {
                    etiqueta: 'Brecha',
                    valor: `${dosDec(brechaCampo.diferencia)} → 0,00`,
                  },
                  { etiqueta: 'Errores', valor: `${lab.erroresFinal}` },
                  { etiqueta: 'Tiempo', valor: formatTiempo(lab.tiempoFinal) },
                ],
                alRepetir: repetir,
              }
            : null
        }
      >
        <div className="tia-lienzo">
          {fase === 'portada' && <PortadaIA portada={portada} onEmpezar={empezar} />}

          <VentanaBase
            marca="Tecnia Entrena"
            subtitulo="Consola del Comité de Acopio · lote de abril"
            claseMarco="tia-marco"
          >
            <div className="cai-cuerpo">
              <div className="tia-mesa">
                <div className="tia-mesa-cabecera">
                  <h2 className="tia-mesa-titulo">
                    Encargo {Math.min(encargo + 1, TOTAL_PASOS)} de {TOTAL_PASOS}
                  </h2>
                  <p className="tia-mesa-encargo">
                    Conjunto de datos de entrenamiento · {LOTE_ABRIL.length} fichas · 2 rasgos · 1
                    etiqueta
                  </p>
                </div>

                <p className="cai-consigna">{consigna}</p>
                {panel()}
                {veredicto && (
                  <p
                    className={`cai-veredicto${veredicto.bien ? '' : ' es-mal'}`}
                    data-testid="cai-veredicto"
                    aria-live="polite"
                  >
                    {veredicto.texto}
                  </p>
                )}
              </div>

              <div className="cai-costado">
                <section className="cai-panel">
                  <h3 className="cai-panel-titulo">Acta de recolección</h3>
                  <dl className="cai-acta">
                    {ACTA_ABRIL.map((linea) => (
                      <div key={linea.campo} style={{ display: 'contents' }}>
                        <dt>{linea.campo}</dt>
                        <dd>{linea.valor}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className="cai-panel">
                  <h3 className="cai-panel-titulo">Bitácora de corridas</h3>
                  {corridas.length === 0 ? (
                    <p className="cai-vacio">
                      Todavía no has medido nada. Lo que se mide se queda anotado aquí y no se borra.
                    </p>
                  ) : (
                    <ul className="cai-bitacora">
                      {corridas.map((c) => (
                        <li
                          key={c.id}
                          className={`cai-corrida${c.tono === 'mentira' ? ' es-mentira' : ''}${c.tono === 'campo' ? ' es-campo' : ''}`}
                        >
                          {c.texto}
                          <b>{c.cifra}</b>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="cai-panel">
                  <h3 className="cai-panel-titulo">La regla del acopio municipal</h3>
                  <p className="tia-nota">
                    El aluminio va a{' '}
                    <b>
                      {NOMBRE_CONTENEDOR[contenedorReal('aluminio', 'sucio')]} aunque venga sucio
                    </b>
                    : la planta lava el metal antes de fundirlo. El PET y el cartón sucios van a
                    basura. Por eso ningún rasgo, él solo, resuelve el problema.
                  </p>
                </section>
              </div>
            </div>
          </VentanaBase>
        </div>
      </ArcadeSala>
    </div>
  );
}

export default LabComoAprendeLaIa;
