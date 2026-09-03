/**
 * Tecnia Datos · `errores.ts` — los errores son la clase.
 *
 * La mitad del valor de este motor está aquí, y en SQL más que en ningún otro
 * sitio: `Error: near "FORM": syntax error` no ha dicho nada, y
 * `SQLITE_CONSTRAINT: FOREIGN KEY constraint failed` ha dicho menos todavía,
 * porque ni siquiera nombra la tabla que se queja.
 *
 * Cada error lleva **cuatro cosas y las cuatro son obligatorias**:
 *
 *   1. el **qué**, en español y sin jerga — «no existe ninguna tabla llamada
 *      «alumnas»»;
 *   2. **dónde**, con línea y columna, porque un guion de SQL tiene veinte
 *      instrucciones y sin la línea el alumno se relee la base entera;
 *   3. la **pista**, que es lo que suele causarlo, y en este motor casi siempre
 *      es **una lista de lo que sí hay**: qué tablas existen, qué columnas
 *      tiene esa tabla, qué funciones hay. Un «no existe» sin la lista al lado
 *      deja al alumno adivinando;
 *   4. la **familia**: lo que ese mismo error dice en un motor de verdad. Se
 *      enseña de segundo, no de primero, y existe porque el día que el alumno
 *      lo busque en internet va a tener que escribir eso y no lo nuestro.
 *
 * Regla de la casa, copiada del §45.5 y de `codigo/errores.ts`: **nada de este
 * motor lanza a través de la puerta pública**. Por dentro se usa `Tropiezo`
 * para salir de la recursión —igual que `Fallo` en `formula/sintaxis.ts`—, pero
 * todo lo que se exporta devuelve el error como dato.
 */

export type ClaseErrorSQL =
  | 'sintaxis'
  | 'tabla'
  | 'columna'
  | 'tipo'
  | 'restriccion'
  | 'agrupacion'
  | 'valor'
  | 'limite';

/** Lo que ese mismo error dice un motor de verdad, para que no suene a chino. */
const FAMILIA: Readonly<Record<ClaseErrorSQL, string>> = {
  sintaxis: 'syntax error',
  tabla: 'no such table',
  columna: 'no such column',
  tipo: 'datatype mismatch',
  restriccion: 'constraint failed',
  agrupacion: 'misuse of aggregate function',
  valor: 'runtime error',
  limite: 'too much data',
};

export interface ErrorSQL {
  clase: ClaseErrorSQL;
  /** En español, en minúscula y sin punto final: se compone con «Línea 4 · ». */
  mensaje: string;
  /** 1 en adelante. `0` sólo si el error no es de ninguna línea en concreto. */
  linea: number;
  /** 1 en adelante, para el dedo debajo. `null` si no se sabe. */
  columna: number | null;
  /** Qué suele causarlo, o qué sí existe. Obligatoria salvo que no haya nada que decir. */
  pista: string | null;
  /** `no such table: alumnas` — lo que verá el día que abra un motor de verdad. */
  familia: string;
}

/** La única excepción del paquete, y no cruza la puerta. */
export class Tropiezo extends Error {
  constructor(readonly detalle: ErrorSQL) {
    super(detalle.mensaje);
    this.name = 'Tropiezo';
  }
}

export function fallo(
  clase: ClaseErrorSQL,
  mensaje: string,
  extra?: { linea?: number; columna?: number | null; pista?: string; familia?: string },
): Tropiezo {
  return new Tropiezo({
    clase,
    mensaje,
    linea: extra?.linea ?? 0,
    columna: extra?.columna ?? null,
    pista: extra?.pista ?? null,
    familia: extra?.familia ?? FAMILIA[clase],
  });
}

/**
 * El error como se lee debajo del editor de consultas.
 *
 *     Línea 2 · no existe ninguna tabla llamada «alumnas»
 *         SELECT * FROM alumnas
 *                       ^
 *         Pista: en esta base hay 3 tablas: alumnos, grupos, calificaciones.
 *         ¿Querías decir «alumnos»?
 *         (un motor de verdad dice aquí: no such table: alumnas)
 */
export function textoDeError(e: ErrorSQL, fuente?: string): string {
  const partes: string[] = [];
  partes.push(e.linea > 0 ? `Línea ${e.linea} · ${e.mensaje}` : e.mensaje);

  if (fuente && e.linea > 0) {
    const linea = fuente.replace(/\r\n?/g, '\n').split('\n')[e.linea - 1];
    if (linea !== undefined && linea.trim() !== '') {
      partes.push(`    ${linea.replace(/\t/g, '    ')}`);
      if (e.columna !== null && e.columna > 0) {
        /* Cada tabulador de delante ocupa cuatro al pintarlo, o el dedo señala
         * a otro sitio justo en los guiones con tabuladores. */
        const desplazamiento = linea.slice(0, e.columna - 1).replace(/\t/g, '    ').length;
        partes.push(`    ${' '.repeat(desplazamiento)}^`);
      }
    }
  }

  if (e.pista) partes.push(`    Pista: ${e.pista}`);
  partes.push(`    (un motor de verdad dice aquí: ${e.familia})`);
  return partes.join('\n');
}

/* ── las dos ayudas que convierten un «no existe» en una pista ──────────────*/

/**
 * `«alumnas» → «alumnos»`, o `null` si no se parece a nada.
 *
 * Es la mitad barata de la pista: la otra mitad es la lista completa, que va
 * siempre. Se acepta hasta un tercio del nombre cambiado —dos letras en una
 * palabra de seis—, que es lo que cubre las erratas de verdad: una letra de
 * más, una de menos, dos cambiadas de sitio, el plural puesto o quitado.
 */
export function masParecido(nombre: string, candidatos: readonly string[]): string | null {
  const a = nombre.toLowerCase();
  let mejor: string | null = null;
  let mejorD = Infinity;
  for (const c of candidatos) {
    const d = distancia(a, c.toLowerCase());
    if (d < mejorD) {
      mejorD = d;
      mejor = c;
    }
  }
  const tope = Math.max(1, Math.floor(a.length / 3));
  return mejor !== null && mejorD <= tope ? mejor : null;
}

/** Levenshtein con dos filas. No hace falta más: los nombres son cortos. */
function distancia(a: string, b: string): number {
  if (a === b) return 0;
  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const actual = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      actual[j] = Math.min(actual[j - 1] + 1, previa[j] + 1, previa[j - 1] + coste);
    }
    previa = actual;
  }
  return previa[b.length];
}

/**
 * «en esta base hay 3 tablas: alumnos, grupos, calificaciones. ¿Querías decir
 * «alumnos»?» — la pista completa, en una función, para que ningún error de
 * este motor se olvide de la lista.
 */
export function pistaDeLista(
  encabezado: string,
  buscado: string,
  candidatos: readonly string[],
): string {
  if (candidatos.length === 0) return `${encabezado} no hay ninguna`;
  const lista = `${encabezado} ${candidatos.join(', ')}`;
  const cerca = masParecido(buscado, candidatos);
  return cerca ? `${lista}. ¿Querías decir «${cerca}»?` : lista;
}
