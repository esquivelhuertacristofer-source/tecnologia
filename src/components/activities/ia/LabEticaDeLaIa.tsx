'use client';

import { useCallback, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { PortadaIA, type DatosPortadaIA } from './PortadaIA';
import {
  CASOS_DEEPFAKE,
  CASOS_NECESITA_DECLARAR,
  CASOS_PLAGIO,
  CAUSAS_PELIGRO_DEEPFAKE,
  CAUSA_PELIGRO_DEEPFAKE_CORRECTA,
  categoriaDeCaso,
  CRITERIOS_PLAGIO,
  CRITERIO_PLAGIO_CORRECTO,
  DECLARACIONES,
  ENCARGOS,
  esCombinacionDeClaraCorrecta,
  esConjuntoDeSenalesValido,
  esDeclaracionHonestaYEspecifica,
  ETIQUETA_VEREDICTO_AUDITORIA,
  ITEMS_AUDITORIA,
  LINEAS,
  OPCIONES_CATEGORIA_CASO,
  OPCIONES_CONFIABILIDAD,
  OPCIONES_NECESITA_DECLARAR,
  PIEZAS_QUE_HICE_YO,
  PIEZAS_QUE_HIZO_LA_IA,
  RUMOR_DEEPFAKE,
  SENALES_VERIFICACION,
  TOTAL_PASOS,
  type CategoriaCaso,
  type Declaracion,
  type Opcion,
  type VeredictoAuditoria,
} from './eticaDeLaIa';
import './salaIA.css';
import './eticaDeLaIa.css';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N8 · U «IA II», parada 3 de 3 · `n8-etica-de-la-ia` · CIERRA LA UNIDAD
 * 2.º de secundaria · 13–14 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * **Tecnia Auditoría.** El porqué de fondo, con la comparación exacta contra
 * `n8-genera-con-ia` y `n8-sesgos-y-errores`, vive en `eticaDeLaIa.ts`. Aquí:
 * nueve encargos, tres actos y un cierre integrador —el mismo papel que tuvo
 * `n8-derechos-y-licencias` cerrando «Producción multimedia y videojuegos»—:
 *
 *  1–2 · **Plagio con IA.** Clasificar cuatro casos con la tabla de verdad de
 *        `categoriaDeCaso` (¿declara? ¿transforma?), después reconocer el
 *        criterio real entre tres reglas fáciles y falsas.
 *  3–5 · **Deepfakes.** Elegir SÓLO las señales que de verdad verifican algo
 *        (fuente, corroboración independiente, contexto — nunca «se ve
 *        realista» ni «lo compartieron muchos»), aplicarlas a dos videos que
 *        se contradicen en apariencia, y nombrar el peligro específico: la
 *        identidad de una persona real, no la falsedad genérica.
 *  6–8 · **Citar el uso de IA.** Cuándo hace falta declarar (no toda
 *        herramienta genera contenido), reconocer una declaración honesta y
 *        específica entre cuatro candidatas, y construir la propia pieza por
 *        pieza.
 *  9   · **El cierre.** «El trabajo de Ana» trae los tres problemas a la vez
 *        en un trabajo escolar real. Ningún criterio es nuevo: se aplican
 *        los ocho anteriores, juntos.
 *
 * ── Lo que se cuidó, y por qué ────────────────────────────────────────────
 *
 * 1. **Ningún veredicto está escrito por caso.** `categoriaDeCaso`,
 *    `esConjuntoDeSenalesValido`, `esDeclaracionHonestaYEspecifica` y
 *    `esCombinacionDeClaraCorrecta` se calculan desde banderas de datos, así
 *    que el panel nunca miente si el dominio cambia.
 * 2. **Los cuatro encargos de clasificación múltiple** (1, 4, 6, 9) comparten
 *    la misma forma: un `Set<string>` de resueltos, un cálculo del conjunto
 *    NUEVO antes de `setState` (nunca dentro de un actualizador), y
 *    `cerrarEncargo()` sólo cuando el conjunto llega a su tamaño total —
 *    mismo cuidado que exige el encabezado de `LabComoAprendeLaIa.tsx`.
 * 3. **`cerrarEncargo` es una sola función** para los nueve encargos,
 *    incluido el que cierra la clase entera: si `hechos >= TOTAL_PASOS`
 *    llama a `lab.terminar`, si no, avanza el índice. Ni el encargo 9 ni
 *    ningún otro necesitan una rama especial para el final.
 * 4. **La bitácora anota UN hallazgo por acto** (plagio, las dos mitades de
 *    deepfakes, declarar-o-no, la cita reconocida, la cita propia): seis
 *    entradas para nueve encargos, ritmo parecido al de `n8-sesgos-y-errores`
 *    (cinco en ocho), no una por cada click.
 * 5. **Ni un `Math.random()` ni un `Date.now()`** fuera del reloj del tiempo
 *    final, igual que sus dos hermanas de esta unidad.
 */

interface Anotacion {
  id: string;
  texto: string;
}

export function LabEticaDeLaIa(props: ActivityProps & { alSalir?: () => void }) {
  const lab = useLabActividad(props, TOTAL_PASOS);
  const { linea, hablar } = useBit();

  const [fase, setFase] = useState<'portada' | 'trabajo'>('portada');
  const [encargo, setEncargo] = useState(0);
  const [senalado, setSenalado] = useState<string | null>(null);
  const [veredicto, setVeredicto] = useState<{ bien: boolean; texto: string } | null>(null);
  const [bitacora, setBitacora] = useState<Anotacion[]>([]);

  const [resueltosPlagio, setResueltosPlagio] = useState<Set<string>>(new Set());
  const [senalesElegidas, setSenalesElegidas] = useState<Set<string>>(new Set());
  const [resueltosDeepfake, setResueltosDeepfake] = useState<Set<string>>(new Set());
  const [resueltosDeclarar, setResueltosDeclarar] = useState<Set<string>>(new Set());
  const [piezaIA, setPiezaIA] = useState<string | null>(null);
  const [piezaAlumno, setPiezaAlumno] = useState<string | null>(null);
  const [resueltosAuditoria, setResueltosAuditoria] = useState<Set<string>>(new Set());

  /* Un encargo se resuelve una sola vez (mismo motivo que sus dos hermanas:
   * el botón que resuelve puede desmontarse al avanzar, pero eso es
   * casualidad del montaje, no garantía). */
  const resueltos = useRef<Set<number>>(new Set());

  const anotar = useCallback((entrada: Anotacion) => {
    setBitacora((previas) => (previas.some((e) => e.id === entrada.id) ? previas : [...previas, entrada]));
  }, []);

  // ── El paso de un encargo al siguiente (o al cierre) ────────────────────
  const cerrarEncargo = useCallback(() => {
    if (resueltos.current.has(encargo)) return;
    resueltos.current.add(encargo);
    const hechos = lab.avanzar();
    if (hechos >= TOTAL_PASOS) {
      lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000), () => hablar(LINEAS.cierre));
      return;
    }
    setSenalado(null);
    setVeredicto(null);
    setEncargo(hechos);
  }, [encargo, hablar, lab]);

  // ── Resolver un encargo de una sola respuesta (E2, E5, E7) ──────────────
  const resolver = useCallback(
    (bien: boolean, texto: string) => {
      setVeredicto({ bien, texto });
      hablar(texto);
      if (bien) {
        cerrarEncargo();
      } else {
        lab.restar();
      }
    },
    [cerrarEncargo, hablar, lab],
  );

  // ── E1 · clasificar cuatro casos de plagio ───────────────────────────────
  const clasificarCaso = useCallback(
    (casoId: string, categoriaId: CategoriaCaso) => {
      if (resueltosPlagio.has(casoId)) return;
      const caso = CASOS_PLAGIO.find((c) => c.id === casoId);
      if (!caso) return;
      const correcta = categoriaDeCaso(caso);
      if (categoriaId !== correcta) {
        setVeredicto({ bien: false, texto: LINEAS.e1_mal });
        hablar(LINEAS.e1_mal);
        lab.restar();
        return;
      }
      const texto = LINEAS.e1_bien(caso);
      setVeredicto({ bien: true, texto });
      hablar(texto);
      const nuevos = new Set(resueltosPlagio);
      nuevos.add(casoId);
      setResueltosPlagio(nuevos);
      if (nuevos.size === CASOS_PLAGIO.length) {
        anotar({ id: 'plagio', texto: 'Plagio con IA: dos preguntas deciden — ¿lo declaras? ¿lo transformas con tu propio análisis?' });
        cerrarEncargo();
      }
    },
    [resueltosPlagio, hablar, lab, anotar, cerrarEncargo],
  );

  // ── E2 · el criterio real ────────────────────────────────────────────────
  const elegirCriterioPlagio = useCallback(
    (op: Opcion) => {
      setSenalado(op.id);
      const bien = op.id === CRITERIO_PLAGIO_CORRECTO;
      resolver(bien, bien ? LINEAS.e2_bien : LINEAS.e2_mal);
    },
    [resolver],
  );

  // ── E3 · las señales de verificación (selección múltiple + verificar) ───
  const toggleSenal = useCallback(
    (id: string) => {
      const nuevo = new Set(senalesElegidas);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      setSenalesElegidas(nuevo);
    },
    [senalesElegidas],
  );

  const verificarSenales = useCallback(() => {
    const bien = esConjuntoDeSenalesValido(senalesElegidas);
    if (bien) anotar({ id: 'deepfake-senales', texto: 'Señales que sí verifican: fuente, corroboración independiente, contexto.' });
    resolver(bien, bien ? LINEAS.e3_bien : LINEAS.e3_mal);
  }, [senalesElegidas, anotar, resolver]);

  // ── E4 · clasificar dos videos, confiable o no ───────────────────────────
  const clasificarDeepfake = useCallback(
    (casoId: string, eleccion: 'confiable' | 'no-confiable') => {
      if (resueltosDeepfake.has(casoId)) return;
      const caso = CASOS_DEEPFAKE.find((c) => c.id === casoId);
      if (!caso) return;
      const correcta: 'confiable' | 'no-confiable' = caso.confiable ? 'confiable' : 'no-confiable';
      if (eleccion !== correcta) {
        setVeredicto({ bien: false, texto: LINEAS.e4_mal });
        hablar(LINEAS.e4_mal);
        lab.restar();
        return;
      }
      const texto = LINEAS.e4_bien(caso);
      setVeredicto({ bien: true, texto });
      hablar(texto);
      const nuevos = new Set(resueltosDeepfake);
      nuevos.add(casoId);
      setResueltosDeepfake(nuevos);
      if (nuevos.size === CASOS_DEEPFAKE.length) {
        anotar({ id: 'deepfake-casos', texto: 'Aplicaste las señales a dos casos: el pulido resultó no confiable, el tosco sí.' });
        cerrarEncargo();
      }
    },
    [resueltosDeepfake, hablar, lab, anotar, cerrarEncargo],
  );

  // ── E5 · el peligro específico ───────────────────────────────────────────
  const elegirCausaPeligro = useCallback(
    (op: Opcion) => {
      setSenalado(op.id);
      const bien = op.id === CAUSA_PELIGRO_DEEPFAKE_CORRECTA;
      resolver(bien, bien ? LINEAS.e5_bien : LINEAS.e5_mal);
    },
    [resolver],
  );

  // ── E6 · ¿esto necesita declaración? ─────────────────────────────────────
  const clasificarDeclarar = useCallback(
    (casoId: string, eleccion: 'si' | 'no') => {
      if (resueltosDeclarar.has(casoId)) return;
      const caso = CASOS_NECESITA_DECLARAR.find((c) => c.id === casoId);
      if (!caso) return;
      const correcta: 'si' | 'no' = caso.necesitaDeclarar ? 'si' : 'no';
      if (eleccion !== correcta) {
        setVeredicto({ bien: false, texto: LINEAS.e6_mal });
        hablar(LINEAS.e6_mal);
        lab.restar();
        return;
      }
      const texto = LINEAS.e6_bien(caso.necesitaDeclarar);
      setVeredicto({ bien: true, texto });
      hablar(texto);
      const nuevos = new Set(resueltosDeclarar);
      nuevos.add(casoId);
      setResueltosDeclarar(nuevos);
      if (nuevos.size === CASOS_NECESITA_DECLARAR.length) {
        anotar({ id: 'declarar', texto: 'No toda herramienta pide declaración: sólo cuando la IA genera contenido nuevo.' });
        cerrarEncargo();
      }
    },
    [resueltosDeclarar, hablar, lab, anotar, cerrarEncargo],
  );

  // ── E7 · reconocer la declaración honesta y específica ───────────────────
  const elegirDeclaracion = useCallback(
    (d: Declaracion) => {
      setSenalado(d.id);
      const bien = esDeclaracionHonestaYEspecifica(d);
      if (bien) anotar({ id: 'cita', texto: 'Cita honesta: qué hizo la IA + qué hiciste tú, sin vaguedad y sin mentir.' });
      resolver(bien, bien ? LINEAS.e7_bien : LINEAS.e7_mal);
    },
    [anotar, resolver],
  );

  // ── E8 · construir la declaración propia, pieza por pieza ────────────────
  const confirmarDeclaracion = useCallback(() => {
    if (!piezaIA || !piezaAlumno) return;
    const bien = esCombinacionDeClaraCorrecta(piezaIA, piezaAlumno);
    if (bien) anotar({ id: 'cita-propia', texto: 'Construiste tu propia declaración honesta y específica.' });
    resolver(bien, bien ? LINEAS.e8_bien : LINEAS.e8_mal);
  }, [piezaIA, piezaAlumno, anotar, resolver]);

  // ── E9 · auditar el trabajo de Ana — cierra la clase entera ──────────────
  const clasificarAuditoria = useCallback(
    (itemId: string, veredictoId: VeredictoAuditoria) => {
      if (resueltosAuditoria.has(itemId)) return;
      const item = ITEMS_AUDITORIA.find((i) => i.id === itemId);
      if (!item) return;
      if (veredictoId !== item.correcta) {
        setVeredicto({ bien: false, texto: LINEAS.e9_mal });
        hablar(LINEAS.e9_mal);
        lab.restar();
        return;
      }
      const texto = LINEAS.e9_bien(item);
      setVeredicto({ bien: true, texto });
      hablar(texto);
      const nuevos = new Set(resueltosAuditoria);
      nuevos.add(itemId);
      setResueltosAuditoria(nuevos);
      if (nuevos.size === ITEMS_AUDITORIA.length) cerrarEncargo();
    },
    [resueltosAuditoria, hablar, lab, cerrarEncargo],
  );

  // ── Arranque y repetición ─────────────────────────────────────────────────

  const empezar = useCallback(() => {
    setFase('trabajo');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const repetir = useCallback(() => {
    resueltos.current = new Set();
    setEncargo(0);
    setSenalado(null);
    setVeredicto(null);
    setBitacora([]);
    setResueltosPlagio(new Set());
    setSenalesElegidas(new Set());
    setResueltosDeepfake(new Set());
    setResueltosDeclarar(new Set());
    setPiezaIA(null);
    setPiezaAlumno(null);
    setResueltosAuditoria(new Set());
    lab.reiniciar(() => hablar(LINEAS.inicio));
  }, [hablar, lab]);

  // ── El panel de cada encargo ─────────────────────────────────────────────

  const panel = () => {
    switch (encargo) {
      // ── E1 · clasifica cuatro casos de plagio ──────────────────────────
      case 0:
        return (
          <div className="eti-casos" data-testid="eti-casos-plagio">
            {CASOS_PLAGIO.map((caso) => {
              const resuelto = resueltosPlagio.has(caso.id);
              return (
                <div key={caso.id} className={`eti-caso${resuelto ? ' es-resuelto' : ''}`} data-testid={`eti-caso-${caso.id}`}>
                  <p className="eti-caso-quien">{caso.quien}</p>
                  <p className="eti-caso-situacion">{caso.situacion}</p>
                  {resuelto ? (
                    <p className="eti-caso-resuelto" data-testid={`eti-resuelto-${caso.id}`}>
                      ✓ {OPCIONES_CATEGORIA_CASO.find((o) => o.id === categoriaDeCaso(caso))?.etiqueta}
                    </p>
                  ) : (
                    <div className="eti-caso-opciones">
                      {OPCIONES_CATEGORIA_CASO.map((op) => (
                        <button
                          key={op.id}
                          type="button"
                          className="eti-caso-opcion"
                          data-testid={`eti-clasificar-${caso.id}-${op.id}`}
                          onClick={() => clasificarCaso(caso.id, op.id)}
                        >
                          {op.etiqueta}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      // ── E2 · el criterio real ────────────────────────────────────────────
      case 1:
        return (
          <div className="eti-opciones" data-testid="eti-opciones-criterio">
            {CRITERIOS_PLAGIO.map((op) => (
              <button
                key={op.id}
                type="button"
                className={`eti-opcion${senalado === op.id ? ' es-senalada' : ''}`}
                data-testid={`eti-criterio-${op.id}`}
                onClick={() => elegirCriterioPlagio(op)}
              >
                {op.texto}
              </button>
            ))}
          </div>
        );

      // ── E3 · las señales que sí verifican ────────────────────────────────
      case 2:
        return (
          <>
            <p className="eti-rumor" data-testid="eti-rumor">
              {RUMOR_DEEPFAKE}
            </p>
            <div className="eti-senales" data-testid="eti-senales">
              {SENALES_VERIFICACION.map((s) => {
                const marcada = senalesElegidas.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`eti-senal${marcada ? ' es-marcada' : ''}`}
                    data-testid={`eti-senal-${s.id}`}
                    aria-pressed={marcada}
                    onClick={() => toggleSenal(s.id)}
                  >
                    <span className="eti-senal-casilla" aria-hidden="true">
                      {marcada ? '✓' : ''}
                    </span>
                    {s.texto}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="eti-verificar"
              data-testid="eti-verificar-senales"
              disabled={senalesElegidas.size === 0}
              onClick={verificarSenales}
            >
              Verificar con estas señales
            </button>
          </>
        );

      // ── E4 · dos videos, confiable o no ──────────────────────────────────
      case 3:
        return (
          <div className="eti-casos" data-testid="eti-casos-deepfake">
            {CASOS_DEEPFAKE.map((caso) => {
              const resuelto = resueltosDeepfake.has(caso.id);
              return (
                <div key={caso.id} className={`eti-caso${resuelto ? ' es-resuelto' : ''}`} data-testid={`eti-deepfake-${caso.id}`}>
                  <p className="eti-caso-situacion">{caso.texto}</p>
                  {resuelto ? (
                    <p className="eti-caso-resuelto" data-testid={`eti-resuelto-deepfake-${caso.id}`}>
                      ✓ {caso.confiable ? 'Confiable' : 'No confiable'}
                    </p>
                  ) : (
                    <div className="eti-caso-opciones">
                      {OPCIONES_CONFIABILIDAD.map((op) => (
                        <button
                          key={op.id}
                          type="button"
                          className="eti-caso-opcion"
                          data-testid={`eti-clasificar-deepfake-${caso.id}-${op.id}`}
                          onClick={() => clasificarDeepfake(caso.id, op.id)}
                        >
                          {op.etiqueta}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      // ── E5 · el peligro específico ───────────────────────────────────────
      case 4:
        return (
          <div className="eti-opciones" data-testid="eti-opciones-peligro">
            {CAUSAS_PELIGRO_DEEPFAKE.map((op) => (
              <button
                key={op.id}
                type="button"
                className={`eti-opcion${senalado === op.id ? ' es-senalada' : ''}`}
                data-testid={`eti-peligro-${op.id}`}
                onClick={() => elegirCausaPeligro(op)}
              >
                {op.texto}
              </button>
            ))}
          </div>
        );

      // ── E6 · ¿esto necesita declaración? ─────────────────────────────────
      case 5:
        return (
          <div className="eti-casos" data-testid="eti-casos-declarar">
            {CASOS_NECESITA_DECLARAR.map((caso) => {
              const resuelto = resueltosDeclarar.has(caso.id);
              return (
                <div key={caso.id} className={`eti-caso${resuelto ? ' es-resuelto' : ''}`} data-testid={`eti-declarar-${caso.id}`}>
                  <p className="eti-caso-situacion">{caso.texto}</p>
                  {resuelto ? (
                    <p className="eti-caso-resuelto" data-testid={`eti-resuelto-declarar-${caso.id}`}>
                      ✓ {caso.necesitaDeclarar ? 'Sí, decláralo' : 'No hace falta'}
                    </p>
                  ) : (
                    <div className="eti-caso-opciones">
                      {OPCIONES_NECESITA_DECLARAR.map((op) => (
                        <button
                          key={op.id}
                          type="button"
                          className="eti-caso-opcion"
                          data-testid={`eti-clasificar-declarar-${caso.id}-${op.id}`}
                          onClick={() => clasificarDeclarar(caso.id, op.id)}
                        >
                          {op.etiqueta}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      // ── E7 · reconoce la declaración honesta y específica ────────────────
      case 6:
        return (
          <div className="eti-opciones" data-testid="eti-opciones-declaracion">
            {DECLARACIONES.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`eti-opcion${senalado === d.id ? ' es-senalada' : ''}`}
                data-testid={`eti-declaracion-${d.id}`}
                onClick={() => elegirDeclaracion(d)}
              >
                «{d.texto}»
              </button>
            ))}
          </div>
        );

      // ── E8 · construye tu propia declaración, pieza por pieza ────────────
      case 7:
        return (
          <div className="eti-piezas" data-testid="eti-piezas">
            <div>
              <p className="eti-pieza-grupo-titulo">Qué hizo la IA</p>
              <div className="eti-pieza-botones">
                {PIEZAS_QUE_HIZO_LA_IA.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`eti-pieza-boton${piezaIA === p.id ? ' es-elegida' : ''}`}
                    data-testid={`eti-pieza-ia-${p.id}`}
                    onClick={() => setPiezaIA(p.id)}
                  >
                    {p.etiqueta}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="eti-pieza-grupo-titulo">Qué hiciste tú</p>
              <div className="eti-pieza-botones">
                {PIEZAS_QUE_HICE_YO.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`eti-pieza-boton${piezaAlumno === p.id ? ' es-elegida' : ''}`}
                    data-testid={`eti-pieza-alumno-${p.id}`}
                    onClick={() => setPiezaAlumno(p.id)}
                  >
                    {p.etiqueta}
                  </button>
                ))}
              </div>
            </div>
            <p className="eti-declaracion-armada" data-testid="eti-declaracion-armada">
              {piezaIA && piezaAlumno
                ? `«${PIEZAS_QUE_HIZO_LA_IA.find((p) => p.id === piezaIA)?.etiqueta}. ${PIEZAS_QUE_HICE_YO.find((p) => p.id === piezaAlumno)?.etiqueta}.»`
                : 'Elige una pieza de cada grupo…'}
            </p>
            <button
              type="button"
              className="eti-verificar"
              data-testid="eti-confirmar-declaracion"
              disabled={!piezaIA || !piezaAlumno}
              onClick={confirmarDeclaracion}
            >
              Confirmar declaración
            </button>
          </div>
        );

      // ── E9 · el cierre: el trabajo de Ana, tres problemas a la vez ───────
      default:
        return (
          <div className="eti-casos" data-testid="eti-casos-auditoria">
            {ITEMS_AUDITORIA.map((item) => {
              const resuelto = resueltosAuditoria.has(item.id);
              return (
                <div key={item.id} className={`eti-caso${resuelto ? ' es-resuelto' : ''}`} data-testid={`eti-auditoria-${item.id}`}>
                  <p className="eti-caso-quien">{item.etiqueta}</p>
                  <p className="eti-caso-situacion">{item.descripcion}</p>
                  {resuelto ? (
                    <p className="eti-caso-resuelto" data-testid={`eti-resuelto-auditoria-${item.id}`}>
                      ✓ {ETIQUETA_VEREDICTO_AUDITORIA[item.correcta]}
                    </p>
                  ) : (
                    <div className="eti-caso-opciones">
                      {(Object.keys(ETIQUETA_VEREDICTO_AUDITORIA) as VeredictoAuditoria[]).map((v) => (
                        <button
                          key={v}
                          type="button"
                          className="eti-caso-opcion"
                          data-testid={`eti-clasificar-auditoria-${item.id}-${v}`}
                          onClick={() => clasificarAuditoria(item.id, v)}
                        >
                          {ETIQUETA_VEREDICTO_AUDITORIA[v]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
    }
  };

  // ── La portada de objetivos, obligatoria al entrar ──────────────────────
  const portada: DatosPortadaIA = {
    situacion: 'Ya generaste contenido con una IA y ya encontraste sus errores. Ahora toca decidir si lo que hiciste con eso estuvo bien.',
    tema: 'Ética: plagio, deepfakes y citas',
    objetivo:
      'Decidir cuándo un texto de IA es plagio y cuándo es tuyo, verificar un rumor con señales reales —no con "se ve bien hecho"—, y escribir una cita honesta y específica sobre cómo usaste una IA.',
    vasAHacer: [
      'Clasificar cuatro casos de uso de un texto de IA con un criterio real, no "usar IA es malo".',
      'Elegir las señales que de verdad verifican un video — y descartar las que no verifican nada.',
      'Aplicar esas señales a dos videos parecidos, con resultados opuestos.',
      'Reconocer y construir una declaración honesta y específica sobre el uso de una IA.',
      'Auditar un trabajo escolar real que trae los tres problemas de hoy a la vez.',
    ],
    encargos: TOTAL_PASOS,
    minutos: 22,
    insignia: { nombre: 'Auditor de IA', emoji: '⚖️' },
    boton: 'Abrir Tecnia Auditoría',
    acento: '#fb7185',
  };

  return (
    <div className="tia-sala">
      <ArcadeSala
        titulo="Ética: plagio, deepfakes y citas"
        pasoEtiqueta="Encargo"
        pasoActual={lab.terminado ? TOTAL_PASOS : lab.pasos}
        pasosTotal={TOTAL_PASOS}
        marcadorEtiqueta="Bitácora"
        marcadorValor={`${bitacora.length}`}
        bit={fase === 'portada' || lab.terminado ? null : linea}
        alSalir={props.alSalir}
        final={
          lab.terminado
            ? {
                insigniaNombre: 'Auditor de IA',
                insigniaEmoji: '⚖️',
                titulo: lab.erroresFinal === 0 ? 'Auditoría cerrada sin un solo error de criterio' : 'Auditoría cerrada. Los tres criterios, aplicados',
                detalle:
                  'Decidiste cuándo un texto de IA es plagio y cuándo es tuyo, aprendiste a no confiar en un video o audio sólo porque "se ve bien hecho", y escribiste la diferencia entre "usé IA" y una cita honesta y específica. Cerraste con un trabajo escolar real que traía los tres problemas a la vez — la misma pregunta, aplicada tres veces: ¿fuiste honesto sobre lo que hiciste y sobre en qué confías? Con esto cierra «IA II».',
                resumen: [
                  { etiqueta: 'Casos decididos', valor: `${CASOS_PLAGIO.length + CASOS_DEEPFAKE.length + CASOS_NECESITA_DECLARAR.length + ITEMS_AUDITORIA.length}` },
                  { etiqueta: 'Declaración construida', valor: '1' },
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

          <VentanaBase marca="Tecnia Auditoría" subtitulo="Los mismos criterios, aplicados a lo que ya hiciste" claseMarco="tia-marco">
            <div className="eti-cuerpo">
              <div className="tia-mesa">
                <div className="tia-mesa-cabecera">
                  <h2 className="tia-mesa-titulo">
                    Encargo {Math.min(encargo + 1, TOTAL_PASOS)} de {TOTAL_PASOS} · {ENCARGOS[encargo]?.titulo}
                  </h2>
                  <p className="tia-mesa-encargo">Aplica el criterio, no memorices el caso</p>
                </div>

                <p className="eti-consigna">{ENCARGOS[encargo]?.situacion}</p>
                {panel()}
                {veredicto && (
                  <p className={`eti-veredicto${veredicto.bien ? '' : ' es-mal'}`} data-testid="eti-veredicto" aria-live="polite">
                    {veredicto.texto}
                  </p>
                )}
              </div>

              <div className="eti-costado">
                <section className="eti-panel">
                  <h3 className="eti-panel-titulo">Los tres criterios de hoy</h3>
                  <ul className="eti-criterios">
                    <li className="eti-criterio">
                      <b>Plagio</b>¿Lo declaras? ¿Lo transformaste con tu propio análisis?
                    </li>
                    <li className="eti-criterio">
                      <b>Deepfakes</b>Fuente, corroboración independiente, contexto — nunca el acabado.
                    </li>
                    <li className="eti-criterio">
                      <b>Citar el uso</b>Qué hizo la IA + qué hiciste tú, sin vaguedad.
                    </li>
                  </ul>
                </section>

                <section className="eti-panel">
                  <h3 className="eti-panel-titulo">Bitácora</h3>
                  {bitacora.length === 0 ? (
                    <p className="eti-vacio">Todavía no encontraste nada. Lo que encuentres se queda anotado aquí y no se borra.</p>
                  ) : (
                    <ul className="eti-bitacora">
                      {bitacora.map((e) => (
                        <li key={e.id} className="eti-entrada">
                          {e.texto}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          </VentanaBase>
        </div>
      </ArcadeSala>
    </div>
  );
}

export default LabEticaDeLaIa;
