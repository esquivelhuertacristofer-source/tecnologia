/**
 * ══════════════════════════════════════════════════════════════════════════
 * TECNIA APRENDIZAJE · `senales.ts` — la junta con el asistente de IA
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── El reparto de papeles, dicho en una línea ─────────────────────────────
 *
 * **Este motor decide; el asistente lo cuenta.**
 *
 * El armazón hermano (`simuladores/asistente/`) dejó escrito cómo se enganchan:
 * el panel calcula y llama a `enviarFicha('…')`, y el guion —escrito por el
 * profesor— contesta con una respuesta literal. La única pieza que faltaba
 * entre los dos es **de dónde salen esos ids de ficha**, y es esto.
 *
 *   const modelo = entrenar(ESQUEMA, banco);
 *   const examen = evaluar(modelo, deExamen);
 *   for (const s of senalesDe({ informe: informeDe(modelo), examen })) {
 *     // s.id === 'ciego:n2/color=negro'
 *     ia.enviarFicha(s.id);   // el guion tiene una regla { tipo:'ficha', ficha: … }
 *   }
 *
 * Si los ids los inventara cada clase, las cuatro actividades se escribirían
 * cuatro vocabularios distintos y el guion del profesor no sería portable. Aquí
 * son **estables y deterministas**: el mismo banco da las mismas señales, con
 * los mismos ids, en el mismo orden.
 *
 * ── Lo que este archivo NO hace ──────────────────────────────────────────
 *
 * No escribe ni una frase para el alumno. Una señal es un **hecho con nombre**
 * («la combinación color=negro con etiqueta gato no está en el banco») más sus
 * números en `datos`. Las palabras las pone el guion de la clase, que es de
 * quien tiene que ser el juicio. Un motor que dijera «te faltaron ejemplos» ya
 * estaría corrigiendo al alumno, y eso está prohibido.
 *
 * ── Por qué las señales no crecen con el banco ────────────────────────────
 *
 * Todas las clases de señal están acotadas por el TAMAÑO DEL ESQUEMA —rasgos ×
 * valores × etiquetas—, no por el número de ejemplos, salvo las que salen de
 * hojas del árbol, y ésas van con tope. Un banco de cinco mil ejemplos no puede
 * ahogar el chat con cinco mil fichas.
 */

import type { Auditoria } from './modelo';
import type { Informe, Prediccion } from './arbol';
import { brechaDe, type Examen } from './examen';

export type ClaseSenal =
  | 'sin-modelo'
  | 'pocos-ejemplos'
  | 'etiqueta-vacia'
  | 'valor-no-visto'
  | 'hueco'
  | 'contradiccion'
  | 'rasgo-constante'
  | 'rasgo-decisivo'
  | 'ciego'
  | 'memoriza'
  | 'empate'
  | 'brecha';

export interface Senal {
  /** Estable y determinista. Es lo que se le pasa a `enviarFicha`. */
  id: string;
  clase: ClaseSenal;
  /** Los números de detrás. El asistente los transporta y no los mira. */
  datos: Record<string, unknown>;
}

export interface Vista {
  auditoria?: Auditoria;
  informe?: Informe;
  examen?: Examen;
  /** Por qué rasgos se mide la brecha. Por omisión, ninguno. */
  brechas?: string[];
  /** Desde qué diferencia una brecha es señal. Por omisión 0,25. */
  brechaMinima?: number;
  /** Cuántas señales como mucho por clase. Por omisión 8. */
  tope?: number;
}

/**
 * Los hechos del banco y del modelo, con un id de ficha estable cada uno.
 *
 * El orden es fijo y va de lo que pasa **antes de entrenar** (faltan datos) a
 * lo que pasa **al probar** (falla este grupo), que es el orden en que la clase
 * los va necesitando.
 */
export function senalesDe(vista: Vista): Senal[] {
  const tope = vista.tope ?? 8;
  const minima = vista.brechaMinima ?? 0.25;
  const salida: Senal[] = [];
  const anadir = (senales: Senal[]) => {
    salida.push(...senales.slice(0, tope));
  };

  const a = vista.auditoria;
  if (a) {
    anadir(
      a.etiquetasVacias.map((etiqueta) => ({
        id: `etiqueta-vacia:${etiqueta}`,
        clase: 'etiqueta-vacia' as const,
        datos: { etiqueta },
      })),
    );
    anadir(
      a.valoresNoVistos.map((c) => ({
        id: `valor-no-visto:${c.rasgo}=${c.valor}`,
        clase: 'valor-no-visto' as const,
        datos: { rasgo: c.rasgo, valor: c.valor },
      })),
    );
    anadir(
      a.huecos.map((h) => ({
        id: `hueco:${h.rasgo}=${h.valor}/${h.etiqueta}`,
        clase: 'hueco' as const,
        datos: { rasgo: h.rasgo, valor: h.valor, etiqueta: h.etiqueta },
      })),
    );
    anadir(
      a.contradicciones.map((c) => ({
        id: `contradiccion:${c.ejemplos[0]}`,
        clase: 'contradiccion' as const,
        datos: { ejemplos: c.ejemplos, etiquetas: c.etiquetas, rasgos: c.rasgos },
      })),
    );
    anadir(
      a.constantes.map((rasgo) => ({
        id: `rasgo-constante:${rasgo}`,
        clase: 'rasgo-constante' as const,
        datos: { rasgo },
      })),
    );
    anadir(
      a.decisivos.map((rasgo) => ({
        id: `rasgo-decisivo:${rasgo}`,
        clase: 'rasgo-decisivo' as const,
        datos: { rasgo },
      })),
    );
  }

  const i = vista.informe;
  if (i) {
    if (i.ejemplos === 0) salida.push({ id: 'sin-modelo', clase: 'sin-modelo', datos: {} });
    anadir(
      i.pocos.map((p) => ({
        id: `pocos-ejemplos:${p.etiqueta}`,
        clase: 'pocos-ejemplos' as const,
        datos: { etiqueta: p.etiqueta, cuantos: p.cuantos },
      })),
    );
    anadir(
      i.ciegos.map((c) => ({
        id: `ciego:${c.nodo}/${c.rasgo}=${c.valor}`,
        clase: 'ciego' as const,
        datos: { rasgo: c.rasgo, valor: c.valor, contestaria: c.contestaria, si: c.si, apoyo: c.apoyo },
      })),
    );
    anadir(
      i.memorizadas.map((r) => ({
        id: `memoriza:${r.nodo}`,
        clase: 'memoriza' as const,
        datos: { si: r.si, entonces: r.entonces, apoyo: r.apoyo },
      })),
    );
    anadir(
      i.reglas
        .filter((r) => r.empate)
        .map((r) => ({
          id: `empate:${r.nodo}`,
          clase: 'empate' as const,
          datos: { si: r.si, entonces: r.entonces, apoyo: r.apoyo },
        })),
    );
  }

  const e = vista.examen;
  if (e) {
    const brechas: Senal[] = [];
    for (const rasgo of vista.brechas ?? []) {
      const b = brechaDe(e, rasgo);
      if (b.peor && b.diferencia >= minima) {
        brechas.push({
          id: `brecha:${rasgo}=${b.peor.valor}`,
          clase: 'brecha',
          datos: {
            rasgo,
            peor: b.peor.valor,
            acierto: b.peor.acierto,
            mejor: b.mejor?.valor ?? null,
            diferencia: b.diferencia,
          },
        });
      }
    }
    anadir(brechas);
  }

  return salida;
}

/**
 * La señal de UNA predicción: la que el panel manda justo después de que el
 * alumno haya probado una cosa concreta y haya visto la respuesta.
 *
 * `null` cuando no hay nada que señalar —el modelo contestó desde una hoja
 * limpia—, que es tanto como decir «aquí no hay clase que dar».
 */
export function senalDePrediccion(prediccion: Prediccion): Senal | null {
  if (prediccion.motivo === 'sin-modelo') {
    return { id: 'sin-modelo', clase: 'sin-modelo', datos: {} };
  }
  if (prediccion.motivo === 'valor-no-visto' && prediccion.atascoEn) {
    const { rasgo, valor, valoresVistos } = prediccion.atascoEn;
    return {
      id: `valor-no-visto:${rasgo}=${valor}`,
      clase: 'valor-no-visto',
      datos: { rasgo, valor, valoresVistos, contesto: prediccion.etiqueta, apoyo: prediccion.apoyo },
    };
  }
  if (prediccion.motivo === 'empate' && prediccion.nodo) {
    return {
      id: `empate:${prediccion.nodo}`,
      clase: 'empate',
      datos: { conteo: prediccion.conteo, contesto: prediccion.etiqueta, apoyo: prediccion.apoyo },
    };
  }
  return null;
}
