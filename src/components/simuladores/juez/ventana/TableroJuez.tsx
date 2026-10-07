'use client';

/**
 * El juez · `ventana/TableroJuez.tsx` — el tablero, sin saber de qué lenguaje.
 *
 * Es todo lo que un concurso tiene y que no depende de si se juzga Python o
 * SQL: la fila de solapas con su marca, el enunciado, el contrato, los
 * ejemplos, el botón de enviar, el veredicto con sus casos y las tres pistas en
 * escalera. Lo único que cambia entre un juez y otro son **tres funciones**
 * —cómo se llama el contrato, cómo se pintan los ejemplos y quién juzga—, y por
 * eso entran como opciones y no como dos copias de este archivo.
 *
 * Se separó al escribir el segundo cliente (`n10-consultas-sql`): con uno solo
 * habría sido adivinar qué era común. Con dos se sabe.
 *
 * ── Las dos decisiones de comportamiento que hay aquí dentro ────────────────
 *
 * **1. Enviar es un gesto, no un efecto de teclear.** En un concurso se
 * escribe, se prueba en local y se envía; el veredicto llega después y a veces
 * duele. Un juez que corrigiera solo mientras el alumno teclea le quitaría el
 * único momento en que tiene que decidir si su solución está lista. (Y por lo
 * práctico: el predicado del encargo corre en cada pintado. Ver `registro.ts`.)
 *
 * **2. El problema activo se ANCLA al enviar, y el ancla caduca con el texto.**
 * Sin ancla, aceptar un problema movía el tablero al siguiente en el mismo
 * instante y el alumno no llegaba a ver su propio veredicto. Sin caducidad, el
 * ancla del problema 1 se quedaba puesta y el envío del 2 juzgaba el 1.
 */

import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import type { ResultadoCaso, Veredicto } from '../modelo';
import { anotar, limpiarRegistro } from '../registro';
import './panelJuez.css';

const GLIFO: Readonly<Record<ResultadoCaso['clase'], string>> = {
  pasa: '✓',
  falla: '✗',
  error: '!',
  'no-termina': '⏱',
  pregunta: '⌨',
  'pide-de-mas': '⌨',
};

const ROTULO: Readonly<Record<ResultadoCaso['clase'], string>> = {
  pasa: 'pasa',
  falla: 'falla',
  error: 'se tropieza',
  'no-termina': 'no termina',
  pregunta: 'pide teclado',
  'pide-de-mas': 'pide de más',
};

/** Lo mínimo que el tablero necesita saber de un problema, sea del juez que sea. */
export interface ProblemaDeTablero {
  id: string;
  titulo: string;
  enunciado: string;
  pistas: readonly [string, string, string];
}

/**
 * Lo MÍNIMO que el tablero necesita de su armazón. `PanelCodigoProps` y
 * `PanelDatosProps` lo cumplen los dos, cada uno con algo más encima
 * (`ejecucion`, de tipos distintos), y de eso el tablero no sabe nada.
 *
 * El tablero es genérico sobre los props completos del armazón —y no sobre
 * estos tres— por una razón concreta: **el pie lo escribe la clase**, y la
 * clase tiene derecho a lo que su propio panel recibe. Recortarlo aquí obligaba
 * al pie de `n10-problemas-de-concurso` a renunciar a `ejecucion` sólo porque
 * este archivo no conoce ese tipo.
 */
export interface PropsDeTablero {
  texto: string;
  senalarLinea: (linea: number) => void;
  revisar: () => void;
  /**
   * El encargo en que va el alumno (§68.4). Si es uno de los problemas, el
   * tablero enseña ése; si no, se queda con «el primero sin aceptar», que es lo
   * que hacía antes y lo que siguen necesitando las pruebas que lo pintan suelto.
   */
  encargoId?: string | null;
}

export interface OpcionesTablero<T extends ProblemaDeTablero, P extends PropsDeTablero> {
  problemas: readonly T[];
  /** La cabecera del contrato: «El juez va a llamar a», «El juez espera». */
  /** Una frase fija, o una por problema (el juez de programas con `datos` no lee nada por teclado). */
  etiquetaContrato: string | ((p: T) => string);
  /** El contrato en sí: la firma de la función, o las columnas que se piden. */
  contrato: (p: T) => string;
  /** Los ejemplos visibles, que cada juez pinta a su manera. */
  ejemplos: (p: T) => ReactNode;
  /** Lo que va debajo de los ejemplos y encima del botón: la ficha del manual (§68.4). */
  manual?: (p: T) => ReactNode;
  /** Cuántos casos de este problema están ocultos. */
  ocultos: (p: T) => number;
  /** Quién juzga. Recibe también los props del panel: el juez de programas saca de ahí los otros archivos del proyecto (M4). */
  juzgar: (p: T, texto: string, props: P) => Veredicto;
  onPista?: (problemaId: string, indice: number) => void;
  onEnvio?: (veredicto: Veredicto) => void;
  /**
   * Lo que la clase quiera poner debajo del tablero, con los problemas ya
   * aceptados. Es la única forma de que un trozo de panel de la clase **se
   * repinte cuando cambia el veredicto**: un hermano suelto sólo se enteraría
   * en la siguiente tecla, porque los veredictos viven en el estado de aquí.
   */
  pie?: ComponentType<P & { aceptados: readonly string[] }>;
}

/**
 * Cuántas líneas del cotejo se pintan antes de resumir el resto.
 *
 * Medido en Chromium el 12-sep-2026 con el problema 1 de `n10-consultas-sql`:
 * doce filas devueltas contra doce esperadas daban un veredicto de **911 px**
 * dentro de una columna de 544, y dejaban 2413 px de contenido por encima del
 * botón de pistas —más de cuatro pantallas de deslizamiento—. El cotejo no es
 * lo que explica el fallo: eso lo dice `explicacion`, que va encima y nombra la
 * fila exacta. El cotejo es el contexto, y ocho líneas de contexto bastan.
 *
 * En Python casi nunca se llega al tope —las salidas esperadas son de una o dos
 * líneas—, así que esto no cambia nada allí.
 */
const TOPE_COTEJO = 8;

function Cotejo({ lineas }: { lineas: string[] }) {
  if (lineas.length === 0) return <i>(nada)</i>;
  const resto = lineas.length - TOPE_COTEJO;
  return (
    <>
      {lineas.slice(0, TOPE_COTEJO).map((l, i) => (
        <code key={i}>{l}</code>
      ))}
      {resto > 0 && <i className="jz-cotejo-mas">y {resto} más</i>}
    </>
  );
}

/* ── un caso, pintado ───────────────────────────────────────────────────────*/

function Caso({ r, senalarLinea }: { r: ResultadoCaso; senalarLinea: (n: number) => void }) {
  return (
    <li className="jz-caso" data-clase={r.clase} data-oculto={r.oculto ? 'si' : 'no'}>
      <span className="jz-caso-glifo" aria-hidden="true">
        {GLIFO[r.clase]}
      </span>
      <span className="jz-caso-cuerpo">
        <span className="jz-caso-nombre">
          {r.oculto && <span className="jz-chapa-oculto">oculto</span>}
          {r.nombre}
          <span className="jz-caso-rotulo">{ROTULO[r.clase]}</span>
        </span>
        {r.clase !== 'pasa' && <span className="jz-caso-porque">{r.explicacion}</span>}
        {r.clase !== 'pasa' && r.esperada && r.obtenida && (
          <span className="jz-caso-cotejo">
            <span>
              <b>lo que dio</b>
              <Cotejo lineas={r.obtenida} />
            </span>
            <span>
              <b>lo esperado</b>
              <Cotejo lineas={r.esperada} />
            </span>
          </span>
        )}
        {r.ruido.length > 0 && (
          <span className="jz-caso-ruido">
            Además tu programa imprimió {r.ruido.length} línea{r.ruido.length === 1 ? '' : 's'} por su cuenta. No cuentan para el veredicto, pero en un
            envío de verdad sobran.
          </span>
        )}
        {r.linea !== undefined && (
          <button type="button" className="jz-ir" onClick={() => senalarLinea(r.linea as number)}>
            Ir a la línea {r.linea}
          </button>
        )}
      </span>
    </li>
  );
}

/* ── el tablero ─────────────────────────────────────────────────────────────*/

export function crearTablero<T extends ProblemaDeTablero, P extends PropsDeTablero = PropsDeTablero>(
  o: OpcionesTablero<T, P>,
) {
  const { problemas, pie: Pie } = o;

  function Tablero(props: P) {
    const { texto, senalarLinea, revisar, encargoId } = props;
    const [veredictos, setVeredictos] = useState<Record<string, Veredicto>>({});
    /* El ancla caduca con el texto **y con el encargo**: sin lo segundo, pasar
     * de un problema aceptado a un encargo de exploración y de ahí al problema
     * siguiente sin tocar el editor dejaba enseñando el problema viejo (§68.4). */
    const [anclado, setAnclado] = useState<{ id: string; texto: string; encargo: string | null } | null>(null);
    const [pistas, setPistas] = useState<Record<string, number>>({});

    /*
     * Una clase nueva empieza con el tablero vacío. El registro es de módulo
     * —tiene que serlo, lo lee el guion— y eso significa que sobrevive a un
     * desmontaje: sin esto, volver a entrar al laboratorio traería aprobados
     * los problemas de la sesión anterior.
     *
     * El efecto no enciende estado de React a propósito: el estado de aquí
     * dentro ya nace vacío al montar. Lo único que hay que hacer es poner el
     * sistema de fuera —el tablero— de acuerdo con él, que es exactamente para
     * lo que existen los efectos.
     */
    useEffect(() => {
      limpiarRegistro();
    }, []);

    const activo = useMemo(() => {
      const vigente = anclado && anclado.texto === texto && anclado.encargo === (encargoId ?? null);
      const fijado = vigente ? problemas.find((p) => p.id === anclado.id) : undefined;
      const delEncargo = encargoId ? problemas.find((p) => p.id === encargoId) : undefined;
      return (
        fijado ?? delEncargo ?? problemas.find((p) => !veredictos[p.id]?.aceptado) ?? problemas[problemas.length - 1]
      );
    }, [anclado, texto, veredictos, encargoId]);

    const v = veredictos[activo.id] ?? null;
    const destapadas = pistas[activo.id] ?? 0;

    const enviar = useCallback(() => {
      const nuevo = o.juzgar(activo, texto, props);
      anotar(nuevo, texto);
      setVeredictos((antes) => ({ ...antes, [activo.id]: nuevo }));
      setAnclado({ id: activo.id, texto, encargo: encargoId ?? null });
      /* El tablero vive fuera de React (`registro.ts`) y el predicado del
       * encargo lo lee desde el guion, que está en otro sitio del árbol: sin
       * este aviso, el encargo no se cerraría hasta la siguiente tecla. */
      revisar();
      o.onEnvio?.(nuevo);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- `props` cambia en cada render; lo que el juez lee de ahí (`proyecto`) lo vigila el ancla del texto.
    }, [activo, texto, revisar, encargoId, props]);

    const pedirPista = useCallback(() => {
      const i = pistas[activo.id] ?? 0;
      if (i >= activo.pistas.length) return;
      setPistas((antes) => ({ ...antes, [activo.id]: i + 1 }));
      o.onPista?.(activo.id, i);
    }, [activo, pistas]);

    const aceptados = useMemo(
      () => problemas.filter((p) => veredictos[p.id]?.aceptado).map((p) => p.id),
      [veredictos],
    );

    const cuantosOcultos = o.ocultos(activo);

    return (
      <div className="jz" data-testid="jz-panel">
        <ol className="jz-lista">
          {problemas.map((p, i) => {
            const w = veredictos[p.id];
            const estado = !w ? 'sin-enviar' : w.aceptado ? 'aceptado' : 'rechazado';
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className="jz-solapa"
                  data-testid={`jz-solapa-${p.id}`}
                  data-estado={estado}
                  aria-current={p.id === activo.id}
                  onClick={() => setAnclado({ id: p.id, texto, encargo: encargoId ?? null })}
                >
                  <span className="jz-solapa-n">{i + 1}</span>
                  <span className="jz-solapa-marca" aria-hidden="true">
                    {estado === 'aceptado' ? '✓' : estado === 'rechazado' ? '✗' : '·'}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <h4 className="jz-titulo">{activo.titulo}</h4>
        <p className="jz-enunciado">{activo.enunciado}</p>
        <p className="jz-firma">
          <span>{typeof o.etiquetaContrato === 'function' ? o.etiquetaContrato(activo) : o.etiquetaContrato}</span>
          <code>{o.contrato(activo)}</code>
        </p>

        <div className="jz-ejemplos">
          <h5>Ejemplos</h5>
          {o.ejemplos(activo)}
          {cuantosOcultos > 0 && (
            <p className="jz-ocultos">
              Y {cuantosOcultos} caso{cuantosOcultos === 1 ? '' : 's'} oculto{cuantosOcultos === 1 ? '' : 's'}: sabes
              cómo se llama{cuantosOcultos === 1 ? '' : 'n'}, no los datos. Tu solución tiene que funcionar también con
              ellos.
            </p>
          )}
        </div>

        {o.manual?.(activo)}

        <button type="button" className="jz-enviar" data-testid="jz-enviar" onClick={enviar}>
          Enviar al juez
        </button>

        {v && (
          <div className="jz-veredicto" data-testid="jz-veredicto" data-aceptado={v.aceptado ? 'si' : 'no'}>
            <p className="jz-marcador">
              <b>{v.aceptado ? 'Aceptado' : 'Rechazado'}</b>
              <span>
                {v.pasados} de {v.total} casos
              </span>
            </p>
            <ul className="jz-casos">
              {v.casos.map((r) => (
                <Caso key={r.nombre} r={r} senalarLinea={senalarLinea} />
              ))}
            </ul>
          </div>
        )}

        <div className="jz-pistas">
          {activo.pistas.slice(0, destapadas).map((p, i) => (
            <p key={i} className="jz-pista" data-cuesta={i === activo.pistas.length - 1 ? 'si' : 'no'}>
              <b>Pista {i + 1}</b>
              {p}
            </p>
          ))}
          {destapadas < activo.pistas.length && (
            <button type="button" className="jz-pedir" data-testid="jz-pista" onClick={pedirPista}>
              {destapadas === activo.pistas.length - 1
                ? `Pedir la pista ${destapadas + 1} (cuesta puntos)`
                : `Pedir la pista ${destapadas + 1}`}
            </button>
          )}
        </div>

        {Pie && <Pie {...props} aceptados={aceptados} />}
      </div>
    );
  }

  return Tablero;
}
