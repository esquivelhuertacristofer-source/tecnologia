'use client';

import { useCallback, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { PortadaIA, type DatosPortadaIA } from './PortadaIA';
import {
  AFIRMACIONES_ASISTENTE,
  ATRIBUTOS,
  CAUSAS_SESGO_IMAGEN,
  CAUSA_SESGO_IMAGEN_CORRECTA,
  COMUNICADO_FERIA,
  COMUNICADO_LABORATORIO,
  CRITERIOS_VERIFICACION,
  CRITERIO_CORRECTO,
  FICHA_REFERENCIA,
  GENERACIONES_NEUTRO,
  GENERACIONES_VARIACION,
  LINEAS,
  OPCIONES_REVISION,
  PREGUNTA_CAPACIDAD,
  PROMPTS_VARIACION,
  PROMPT_NEUTRO,
  RESPUESTA_CAPACIDAD_CORRECTA,
  RESULTADOS_A_CLASIFICAR,
  TOTAL_PASOS,
  atributosConstantes,
  type ComunicadoResumen,
  type OpcionRevision,
} from './sesgosYErrores';
import './salaIA.css';
import './sesgosYErrores.css';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N8 · U «IA II», parada 2 · `n8-sesgos-y-errores`
 * 2.º de secundaria · 13–14 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * **Tecnia Generador.** Ver el porqué de fondo en `sesgosYErrores.ts`: aquí
 * no se entrena nada, se usa una IA ya entrenada y sólo se ven sus salidas.
 * Ocho encargos, en tres actos y un cierre:
 *
 *  1–2 · **La alucinación.** Cuatro afirmaciones con el mismo tono seguro;
 *        una contradice la ficha de referencia. El criterio que la encuentra
 *        NO es el tono: es comparar el dato exacto contra una fuente.
 *  3–5 · **El patrón del generador de imágenes.** Cuatro generaciones del
 *        mismo prompt neutro comparten un solo dato fijo (el tono de piel);
 *        con el prompt explícito, ese mismo generador SÍ varía — así que no
 *        era una limitación técnica, era un valor por defecto no pedido.
 *  6–7 · **El resumen que falla de dos formas.** Uno omite un dato (la
 *        condición de registro desaparece); el otro invierte uno (una
 *        prohibición se vuelve permiso) — la segunda, más peligrosa, porque
 *        el resumen no se ve incompleto.
 *  8   · **El cierre.** Cuatro resultados —dos ya vistos, dos nuevos— y
 *        cuatro revisiones humanas distintas: no hay una regla única.
 *
 * ── Lo que se cuidó, y por qué ────────────────────────────────────────────
 *
 * 1. **El atributo del sesgo se calcula, no se cuenta a ojo**
 *    (`atributosConstantes`, en el dominio): si algún día cambia una fila de
 *    generaciones, el encargo 3 sigue teniendo la respuesta que los datos de
 *    verdad sostienen.
 * 2. **El cierre aplica el criterio a casos nuevos.** Dos de los cuatro
 *    resultados del encargo 8 (el contrato, el medicamento) no aparecieron
 *    antes: clasificarlos exige el criterio, no la memoria.
 * 3. **Los avisos salen del gesto**, nunca de dentro de un actualizador de
 *    `setState` (modo estricto duplicaría el progreso).
 * 4. **Ni un `Math.random()` ni un `Date.now()` en la lógica** (fuera de
 *    leer el reloj para el tiempo final, igual que sus hermanas de IA): las
 *    "generaciones" son datos fijos, no una simulación con semilla.
 */

interface Anotacion {
  id: string;
  texto: string;
  cifra: string;
}

export function LabSesgosYErrores(props: ActivityProps & { alSalir?: () => void }) {
  const lab = useLabActividad(props, TOTAL_PASOS);
  const { linea, hablar } = useBit();

  const [fase, setFase] = useState<'portada' | 'trabajo'>('portada');
  const [encargo, setEncargo] = useState(0);
  const [senalado, setSenalado] = useState<string | null>(null);
  const [veredicto, setVeredicto] = useState<{ bien: boolean; texto: string } | null>(null);
  const [bitacora, setBitacora] = useState<Anotacion[]>([]);
  const [neutroGenerado, setNeutroGenerado] = useState(false);
  const [variacionGenerada, setVariacionGenerada] = useState(false);
  const [resueltosCierre, setResueltosCierre] = useState<Set<string>>(new Set());

  /* Un encargo se resuelve una sola vez (mismo motivo que `n7-como-aprende-la-ia`:
   * el botón que resuelve se desmonta al avanzar, pero eso es casualidad del
   * montaje, no garantía). */
  const resueltos = useRef<Set<number>>(new Set());

  const anotar = useCallback((entrada: Anotacion) => {
    setBitacora((previas) => (previas.some((e) => e.id === entrada.id) ? previas : [...previas, entrada]));
  }, []);

  // ── Resolver un encargo de una sola respuesta. El aviso sale de aquí. ────
  const resolver = useCallback(
    (bien: boolean, texto: string) => {
      if (bien) {
        if (resueltos.current.has(encargo)) return;
        resueltos.current.add(encargo);
        setVeredicto({ bien: true, texto });
        hablar(texto);
        const hechos = lab.avanzar();
        if (hechos >= TOTAL_PASOS) {
          lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000), () => hablar(LINEAS.cierre));
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

  /**
   * El encargo 8 no se resuelve con una respuesta: son cuatro. Cada acierto
   * queda anotado por separado, y el encargo entero sólo avanza cuando los
   * cuatro están clasificados. Un intento equivocado NO borra los ya
   * acertados: se queda ahí, reintentable, igual que cualquier otro encargo.
   */
  const clasificarResultado = useCallback(
    (resultadoId: string, opcionId: OpcionRevision) => {
      if (resueltosCierre.has(resultadoId)) return;
      const item = RESULTADOS_A_CLASIFICAR.find((r) => r.id === resultadoId);
      if (!item) return;

      if (opcionId !== item.categoriaCorrecta) {
        const texto = opcionId === 'usar-tal-cual' ? LINEAS.e8_mal_tal_cual : LINEAS.e8_mal;
        setVeredicto({ bien: false, texto });
        hablar(texto);
        lab.restar();
        return;
      }

      const texto =
        item.categoriaCorrecta === 'verificar-fuente'
          ? LINEAS.e8_verificar_fuente
          : item.categoriaCorrecta === 'revisar-representacion'
            ? LINEAS.e8_revisar_representacion
            : LINEAS.e8_no_usar_sin_experto;
      setVeredicto({ bien: true, texto });
      hablar(texto);

      const nuevos = new Set(resueltosCierre);
      nuevos.add(resultadoId);
      setResueltosCierre(nuevos);

      if (nuevos.size === RESULTADOS_A_CLASIFICAR.length) {
        if (resueltos.current.has(encargo)) return;
        resueltos.current.add(encargo);
        lab.avanzar();
        lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000), () => hablar(LINEAS.cierre));
      }
    },
    [resueltosCierre, encargo, hablar, lab],
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
    setBitacora([]);
    setNeutroGenerado(false);
    setVariacionGenerada(false);
    setResueltosCierre(new Set());
    lab.reiniciar(() => hablar(LINEAS.inicio));
  }, [hablar, lab]);

  // ── El panel de un comunicado: fuente vs. resumen, y el dato que falló ──
  const panelComunicado = (
    comunicado: ComunicadoResumen,
    lineas: { bien: string; mal: string },
    bitacoraId: string,
    bitacoraTexto: string,
  ) => (
    <>
      <div className="sye-comparacion">
        <div className="sye-comparacion-caja">
          <span className="sye-comparacion-etiqueta">{comunicado.tituloFuente}</span>
          <p>{comunicado.fuente}</p>
        </div>
        <div className="sye-comparacion-caja es-resumen">
          <span className="sye-comparacion-etiqueta">Resumen de la IA</span>
          <p>{comunicado.resumen}</p>
        </div>
      </div>
      <p className="tia-nota">Señala el dato de la fuente que el resumen no respeta.</p>
      <div className="sye-opciones">
        {comunicado.datos.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`sye-opcion${senalado === d.id ? ' es-senalada' : ''}`}
            data-testid={`sye-dato-${comunicado.id}-${d.id}`}
            onClick={() => {
              setSenalado(d.id);
              const bien = d.id === comunicado.datoFallado;
              if (bien) {
                anotar({
                  id: bitacoraId,
                  texto: bitacoraTexto,
                  cifra: comunicado.tipoFallo === 'omision' ? 'omitido' : 'invertido',
                });
              }
              resolver(bien, bien ? lineas.bien : lineas.mal);
            }}
          >
            {d.texto}
          </button>
        ))}
      </div>
    </>
  );

  // ── Los paneles de cada encargo ─────────────────────────────────────────

  const consigna = [
    'Bit le preguntó al asistente sobre el sistema solar para su exposición de Ciencias. Las cuatro frases suenan igual de seguras. Contra la ficha de referencia, señala la que es falsa.',
    '¿Cómo se sabe que ésa es la falsa, y no otra? Señala el criterio correcto.',
    'Genera «una doctora» cuatro veces. Cuando las cuatro estén listas, señala el dato que se repite igual en las cuatro.',
    'Ahora pídele lo mismo, pero con el tono de piel o el género explícito. Genera las tres variaciones y contesta.',
    '¿Qué fue lo que pasó, entonces? Señala la explicación correcta.',
    'Compara el comunicado con el resumen que hizo la IA. Señala el dato que el resumen se comió.',
    'Compara el reglamento con el resumen que hizo la IA. Señala el dato que el resumen dijo al revés.',
    'Cuatro resultados de una IA, cuatro decisiones distintas. Clasifica los cuatro.',
  ][encargo];

  const panel = () => {
    switch (encargo) {
      // ── E1 · la alucinación ─────────────────────────────────────────────
      case 0:
        return (
          <div className="sye-afirmaciones">
            {AFIRMACIONES_ASISTENTE.map((af) => (
              <button
                key={af.id}
                type="button"
                className={`sye-afirmacion${senalado === af.id ? ' es-senalada' : ''}`}
                data-testid={`sye-afirmacion-${af.id}`}
                onClick={() => {
                  setSenalado(af.id);
                  if (af.esFalsa) {
                    anotar({ id: 'alucinacion', texto: 'Alucinación encontrada: lunas de Marte', cifra: '3 → 2' });
                  }
                  resolver(af.esFalsa, af.esFalsa ? LINEAS.e1_bien : LINEAS.e1_mal);
                }}
              >
                {af.texto}
              </button>
            ))}
          </div>
        );

      // ── E2 · el criterio correcto ────────────────────────────────────────
      case 1:
        return (
          <div className="sye-opciones">
            {CRITERIOS_VERIFICACION.map((op) => (
              <button
                key={op.id}
                type="button"
                className={`sye-opcion${senalado === op.id ? ' es-senalada' : ''}`}
                data-testid={`sye-criterio-${op.id}`}
                onClick={() => {
                  setSenalado(op.id);
                  const bien = op.id === CRITERIO_CORRECTO;
                  resolver(bien, bien ? LINEAS.e2_bien : LINEAS.e2_mal);
                }}
              >
                {op.texto}
              </button>
            ))}
          </div>
        );

      // ── E3 · el patrón del generador (prompt neutro) ─────────────────────
      case 2: {
        if (!neutroGenerado) {
          return (
            <div className="sye-generar">
              <p>El generador de imágenes todavía no corrió. Pídele «{PROMPT_NEUTRO}» cuatro veces.</p>
              <button
                type="button"
                className="tia-boton"
                data-testid="sye-generar-neutro"
                onClick={() => {
                  setNeutroGenerado(true);
                  anotar({ id: 'neutro', texto: `Generaste «${PROMPT_NEUTRO}» ×4`, cifra: '4 tarjetas' });
                  hablar(`Cuatro generaciones de «${PROMPT_NEUTRO}», listas.`);
                }}
              >
                Generar «{PROMPT_NEUTRO}» ×4
              </button>
            </div>
          );
        }
        const constantes = atributosConstantes(GENERACIONES_NEUTRO);
        return (
          <div className="sye-tabla-caja">
            <table className="sye-tabla" aria-label={`Cuatro generaciones de «${PROMPT_NEUTRO}»`}>
              <thead>
                <tr>
                  <th scope="col">Generación</th>
                  {ATRIBUTOS.map((attr) => (
                    <th key={attr.id} scope="col">
                      <button
                        type="button"
                        className={`sye-cabecera${senalado === attr.id ? ' es-elegida' : ''}`}
                        data-testid={`sye-atributo-${attr.id}`}
                        onClick={() => {
                          setSenalado(attr.id);
                          const bien = constantes.has(attr.id);
                          resolver(bien, bien ? LINEAS.e3_bien : LINEAS.e3_mal);
                        }}
                      >
                        {attr.etiqueta}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GENERACIONES_NEUTRO.map((g, i) => (
                  <tr key={g.id}>
                    <td>#{i + 1}</td>
                    <td>{g.edad}</td>
                    <td>{g.tono}</td>
                    <td>{g.cabello}</td>
                    <td>{g.fondo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      // ── E4 · la variación explícita ──────────────────────────────────────
      case 3: {
        if (!variacionGenerada) {
          return (
            <div className="sye-generar">
              <p>Esta vez pídele el tono de piel o el género explícito. Genera las tres variaciones.</p>
              <button
                type="button"
                className="tia-boton"
                data-testid="sye-generar-variacion"
                onClick={() => {
                  setVariacionGenerada(true);
                  anotar({ id: 'variacion', texto: 'Generaste con variación explícita ×3', cifra: '3 tonos distintos' });
                  hablar('Tres generaciones más, esta vez con el rasgo pedido explícito.');
                }}
              >
                Generar con variación explícita ×3
              </button>
            </div>
          );
        }
        return (
          <>
            <div className="sye-tabla-caja">
              <table className="sye-tabla" aria-label="Tres generaciones con variación explícita">
                <thead>
                  <tr>
                    <th scope="col">Prompt</th>
                    {ATRIBUTOS.map((attr) => (
                      <th key={attr.id} scope="col">
                        {attr.etiqueta}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PROMPTS_VARIACION.map((p, i) => {
                    const g = GENERACIONES_VARIACION[i];
                    return (
                      <tr key={p.id}>
                        <td>«{p.texto}»</td>
                        <td>{g.edad}</td>
                        <td>{g.tono}</td>
                        <td>{g.cabello}</td>
                        <td>{g.fondo}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="tia-nota">
              <b>¿El generador es capaz de producir personas de otro tono de piel?</b>
            </p>
            <div className="sye-opciones">
              {PREGUNTA_CAPACIDAD.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  className={`sye-opcion${senalado === op.id ? ' es-senalada' : ''}`}
                  data-testid={`sye-capacidad-${op.id}`}
                  onClick={() => {
                    setSenalado(op.id);
                    const bien = op.id === RESPUESTA_CAPACIDAD_CORRECTA;
                    resolver(bien, bien ? LINEAS.e4_bien : LINEAS.e4_mal);
                  }}
                >
                  {op.texto}
                </button>
              ))}
            </div>
          </>
        );
      }

      // ── E5 · la explicación correcta ─────────────────────────────────────
      case 4:
        return (
          <div className="sye-opciones">
            {CAUSAS_SESGO_IMAGEN.map((op) => (
              <button
                key={op.id}
                type="button"
                className={`sye-opcion${senalado === op.id ? ' es-senalada' : ''}`}
                data-testid={`sye-causa-${op.id}`}
                onClick={() => {
                  setSenalado(op.id);
                  const bien = op.id === CAUSA_SESGO_IMAGEN_CORRECTA;
                  resolver(bien, bien ? LINEAS.e5_bien : LINEAS.e5_mal);
                }}
              >
                {op.texto}
              </button>
            ))}
          </div>
        );

      // ── E6 · el resumen que omite ────────────────────────────────────────
      case 5:
        return panelComunicado(
          COMUNICADO_FERIA,
          { bien: LINEAS.e6_bien, mal: LINEAS.e6_mal },
          'feria',
          'Comunicado de la feria: dato omitido',
        );

      // ── E7 · el resumen que invierte ─────────────────────────────────────
      case 6:
        return panelComunicado(
          COMUNICADO_LABORATORIO,
          { bien: LINEAS.e7_bien, mal: LINEAS.e7_mal },
          'laboratorio',
          'Reglamento del laboratorio: dato invertido',
        );

      // ── E8 · el cierre: cuatro resultados, cuatro revisiones ─────────────
      default:
        return (
          <div className="sye-resultados">
            {RESULTADOS_A_CLASIFICAR.map((r) => {
              const resuelto = resueltosCierre.has(r.id);
              return (
                <div key={r.id} className={`sye-resultado${resuelto ? ' es-resuelto' : ''}`}>
                  <p className="sye-resultado-etiqueta">{r.etiqueta}</p>
                  <p className="sye-resultado-descripcion">{r.descripcion}</p>
                  {resuelto ? (
                    <p className="sye-resultado-resuelta" data-testid={`sye-resuelto-${r.id}`}>
                      ✓ {OPCIONES_REVISION.find((o) => o.id === r.categoriaCorrecta)?.etiqueta}
                    </p>
                  ) : (
                    <div className="sye-resultado-opciones">
                      {OPCIONES_REVISION.map((op) => (
                        <button
                          key={op.id}
                          type="button"
                          className="sye-resultado-opcion"
                          data-testid={`sye-clasificar-${r.id}-${op.id}`}
                          onClick={() => clasificarResultado(r.id, op.id)}
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
    }
  };

  // ── La portada de objetivos, obligatoria al entrar ──────────────────────
  const portada: DatosPortadaIA = {
    situacion: 'Bit está preparando su exposición de Ciencias sobre el sistema solar, y ya le preguntó a un asistente de IA.',
    tema: 'Sesgos y errores de la IA',
    objetivo:
      'Detectar cuándo una IA generativa ya entrenada se equivoca —alucina, repite un patrón o distorsiona un resumen— sin poder abrir sus datos, y decidir qué revisión humana necesita cada resultado.',
    vasAHacer: [
      'Comparar la respuesta segura del asistente contra una ficha de referencia y encontrar la alucinación.',
      'Generar la misma imagen varias veces y medir qué dato nunca cambia.',
      'Repetir el prompt con una variación explícita para descartar la excusa fácil.',
      'Comparar dos resúmenes de la IA contra su fuente: uno que omite, otro que invierte.',
      'Clasificar cuatro resultados según el tipo de revisión humana que cada uno necesita.',
    ],
    encargos: TOTAL_PASOS,
    minutos: 20,
    insignia: { nombre: 'Detector de sesgos', emoji: '⚠️' },
    boton: 'Abrir Tecnia Generador',
    acento: '#fbbf24',
  };

  return (
    <div className="tia-sala">
      <ArcadeSala
        titulo="Sesgos y errores de la IA"
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
                insigniaNombre: 'Detector de sesgos',
                insigniaEmoji: '⚠️',
                titulo:
                  lab.erroresFinal === 0
                    ? 'Ficha cerrada sin un solo error de criterio'
                    : 'Ficha cerrada. La seguridad del tono no bastaba',
                detalle:
                  'La IA no te dejó auditar nada: sólo viste sus salidas. Aun así encontraste la alucinación comparando un dato exacto, no por el tono; encontraste el patrón del generador porque no varió lo que importaba en cuatro intentos, y lo confirmaste pidiéndole explícito que variara; y encontraste dos formas distintas de que un resumen falle —comerse un dato y decirlo al revés—, la segunda más peligrosa porque no se ve incompleta. Y al cierre, los cuatro resultados no pedían la misma revisión.',
                resumen: [
                  { etiqueta: 'Alucinación encontrada', valor: 'Lunas de Marte' },
                  { etiqueta: 'Atributo del sesgo', valor: 'tono de piel' },
                  { etiqueta: 'Comunicados comparados', valor: '2' },
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

          <VentanaBase marca="Tecnia Generador" subtitulo="IA ya entrenada · sólo ves la salida" claseMarco="tia-marco">
            <div className="sye-cuerpo">
              <div className="tia-mesa">
                <div className="tia-mesa-cabecera">
                  <h2 className="tia-mesa-titulo">
                    Encargo {Math.min(encargo + 1, TOTAL_PASOS)} de {TOTAL_PASOS}
                  </h2>
                  <p className="tia-mesa-encargo">Detecta el error en la salida, no en el entrenamiento</p>
                </div>

                <p className="sye-consigna">{consigna}</p>
                {panel()}
                {veredicto && (
                  <p
                    className={`sye-veredicto${veredicto.bien ? '' : ' es-mal'}`}
                    data-testid="sye-veredicto"
                    aria-live="polite"
                  >
                    {veredicto.texto}
                  </p>
                )}
              </div>

              <div className="sye-costado">
                <section className="sye-panel">
                  <h3 className="sye-panel-titulo">Ficha de referencia</h3>
                  <dl className="sye-ficha">
                    {FICHA_REFERENCIA.map((l) => (
                      <div key={l.campo} style={{ display: 'contents' }}>
                        <dt>{l.campo}</dt>
                        <dd>{l.valor}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className="sye-panel">
                  <h3 className="sye-panel-titulo">Bitácora</h3>
                  {bitacora.length === 0 ? (
                    <p className="sye-vacio">
                      Todavía no encontraste nada. Lo que encuentres se queda anotado aquí y no se borra.
                    </p>
                  ) : (
                    <ul className="sye-bitacora">
                      {bitacora.map((e) => (
                        <li key={e.id} className="sye-entrada">
                          {e.texto} · <b>{e.cifra}</b>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="sye-panel">
                  <h3 className="sye-panel-titulo">La regla de este laboratorio</h3>
                  <p className="tia-nota">
                    La seguridad del tono <b>no</b> es evidencia. Compara siempre contra un dato, nunca contra cómo
                    suena la frase.
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

export default LabSesgosYErrores;
