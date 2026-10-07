/**
 * El juez · `juezSql.ts` — la misma idea, pero la respuesta es una tabla.
 *
 * ── Por qué un juez de SQL no puede ser el de Python con otro motor ─────────
 *
 * Porque en Python la respuesta la imprime el alumno y aquí la **devuelve el
 * motor**, y eso cambia tres cosas de raíz:
 *
 * 1. **Los datos del caso no entran por argumentos: SON la base.** Un caso
 *    oculto de SQL es *otra tabla*. Es la única forma de tumbar la trampa que
 *    la auditoría del 2-sep-2026 encontró en `n10-consultas-sql` —un encargo
 *    que se regalaba porque los datos estaban sembrados en orden alfabético y
 *    `SELECT * FROM x` ya salía ordenado—: con una segunda siembra desordenada,
 *    el `ORDER BY` deja de ser decorativo.
 * 2. **El orden de las filas casi nunca importa.** Un `SELECT` sin `ORDER BY`
 *    no promete orden, ni aquí ni en Postgres, así que comparar en orden sería
 *    suspender a quien tiene razón. Por eso `ordenImporta` es **false** de
 *    fábrica y se pone a true **sólo** cuando el enunciado pide un orden — y
 *    entonces ese orden es la respuesta.
 * 3. **Los nombres de las columnas no se juzgan, el número sí.** Un alumno
 *    puede llamar `total` o `cuantos` a lo que cuenta y las dos son correctas;
 *    lo que no puede es devolver tres columnas donde se piden dos. El
 *    enunciado dice qué columnas y en qué orden; el juez comprueba cuántas y
 *    qué llevan dentro.
 *
 * ── Qué se juzga de una tanda de sentencias ─────────────────────────────────
 *
 * El **último resultado de clase `consulta`**. Un alumno puede escribir un
 * `CREATE` de apoyo, un `INSERT` y después su `SELECT`; lo que contesta al
 * problema es el `SELECT`. Si no hay ninguna consulta, el veredicto lo dice
 * con esas palabras y no con un error.
 */

import { BASE_VACIA, textoDeValor, type Base, type Valor } from '../datos/modelo';
import { ejecutar, type Resultado } from '../datos/motor';
import { textoDeError } from '../datos/errores';
import { veredictoDe, type ResultadoCaso, type Veredicto } from './modelo';

/** Lo que se escribe en un caso: texto, número, sí/no o vacío. */
export type Celda = string | number | boolean | null;

export interface CasoSql {
  nombre: string;
  /**
   * El SQL que monta la base de este caso: `CREATE TABLE` + `INSERT`. El alumno
   * ve el de los casos visibles (es el ejemplo del enunciado) y **nunca** el de
   * los ocultos.
   */
  prepara: string;
  /** Las filas que tiene que devolver, sin encabezados. Literales. */
  esperada: Celda[][];
  /** `true` sólo si el enunciado pide un orden. Ver la cabecera. */
  ordenImporta?: boolean;
  oculto?: boolean;
}

export interface ProblemaSql {
  id: string;
  titulo: string;
  enunciado: string;
  /** Qué columnas y en qué orden. Es el contrato, como la firma en Python. */
  columnas: string;
  casos: CasoSql[];
  pistas: readonly [string, string, string];
}

/* ── la comparación ─────────────────────────────────────────────────────────*/

/** Una celda, como texto, con las mismas reglas con que la hoja la enseña. */
function celdaATexto(c: Celda): string {
  if (c === null) return '';
  if (typeof c === 'boolean') return c ? 'sí' : 'no';
  return String(c);
}

function filaATexto(f: Valor[]): string[] {
  return f.map(textoDeValor);
}

/**
 * «1 fila», «3 filas». El «fila(s)» que había aquí es de mensaje de
 * compilador, no de algo que lea una persona de quince años.
 */
const plural = (n: number, singular: string) => `${n} ${singular}${n === 1 ? '' : 's'}`;

/** Una fila como una sola cadena, para poder ordenar y contar sin orden. */
const clave = (f: string[]) => f.join('');

function comparar(
  obtenidas: string[][],
  esperadas: string[][],
  ordenImporta: boolean,
): { igual: boolean; explicacion: string } {
  if (obtenidas.length !== esperadas.length) {
    return {
      igual: false,
      explicacion:
        obtenidas.length === 0
          ? `tu consulta no devolvió ninguna fila y este caso tiene ${esperadas.length}`
          : `tu consulta devolvió ${plural(obtenidas.length, 'fila')} y este caso tiene ${esperadas.length}`,
    };
  }
  if (esperadas.length > 0 && obtenidas[0].length !== esperadas[0].length) {
    return {
      igual: false,
      explicacion: `tu consulta devolvió ${plural(obtenidas[0].length, 'columna')} y el problema pide ${esperadas[0].length}`,
    };
  }

  if (ordenImporta) {
    for (let i = 0; i < esperadas.length; i++) {
      if (clave(obtenidas[i]) !== clave(esperadas[i])) {
        return {
          igual: false,
          explicacion: `la fila ${i + 1} dice «${obtenidas[i].join(' | ')}» y tenía que decir «${esperadas[i].join(' | ')}»`,
        };
      }
    }
    return { igual: true, explicacion: 'pasa' };
  }

  /* Sin orden: mismas filas con las mismas repeticiones. Un multiconjunto, no
   * un conjunto — dos filas iguales son dos filas, y una consulta que pierde
   * una está mal. */
  const bolsa = new Map<string, number>();
  for (const f of esperadas) bolsa.set(clave(f), (bolsa.get(clave(f)) ?? 0) + 1);
  for (const f of obtenidas) {
    const k = clave(f);
    const n = bolsa.get(k) ?? 0;
    if (n === 0) {
      return { igual: false, explicacion: `sobra la fila «${f.join(' | ')}», que no es de este caso` };
    }
    bolsa.set(k, n - 1);
  }
  const falta = [...bolsa.entries()].find(([, n]) => n > 0);
  if (falta) {
    return { igual: false, explicacion: `falta la fila «${falta[0].split('').join(' | ')}»` };
  }
  return { igual: true, explicacion: 'pasa' };
}

/* ── el juez ────────────────────────────────────────────────────────────────*/

/** Monta la base del caso. Si el `prepara` de la clase está mal, se ve aquí y no en el alumno. */
function baseDe(caso: CasoSql): { ok: true; base: Base } | { ok: false; queja: string } {
  const r = ejecutar(BASE_VACIA, caso.prepara);
  if (!r.ok) return { ok: false, queja: `el caso «${caso.nombre}» no se pudo montar: ${textoDeError(r.error)}` };
  return { ok: true, base: r.base };
}

export function juzgarCasoSql(caso: CasoSql, sql: string): ResultadoCaso {
  const esperada = caso.esperada.map((f) => f.map(celdaATexto).join(' | '));
  const base = { nombre: caso.nombre, oculto: !!caso.oculto, esperada, ruido: [] as string[] };

  const montada = baseDe(caso);
  if (!montada.ok) {
    return { ...base, clase: 'error', obtenida: null, explicacion: montada.queja };
  }

  const r = ejecutar(montada.base, sql);
  if (!r.ok) {
    return { ...base, clase: 'error', obtenida: null, explicacion: textoDeError(r.error) };
  }

  const consultas = r.resultados.filter((x: Resultado) => x.clase === 'consulta');
  const ultima = consultas[consultas.length - 1];
  if (!ultima) {
    return {
      ...base,
      clase: 'falla',
      obtenida: [],
      explicacion: 'tu SQL corrió pero no tiene ninguna consulta: lo que contesta a un problema es un SELECT',
    };
  }

  const obtenidas = ultima.filas.map(filaATexto);
  const { igual, explicacion } = comparar(
    obtenidas,
    caso.esperada.map((f) => f.map(celdaATexto)),
    !!caso.ordenImporta,
  );

  return {
    ...base,
    clase: igual ? 'pasa' : 'falla',
    obtenida: obtenidas.map((f) => f.join(' | ')),
    explicacion,
  };
}

export function juzgarSql(problema: ProblemaSql, sql: string): Veredicto {
  return veredictoDe(
    problema.id,
    problema.casos.map((c) => juzgarCasoSql(c, sql)),
  );
}

/**
 * La misma revisión que en Python, con las dos quejas propias de SQL: un caso
 * sin `prepara` y **dos casos con la misma siembra** (que es un caso oculto que
 * no oculta nada).
 */
export function revisarProblemaSql(p: ProblemaSql): string[] {
  const quejas: string[] = [];
  if (p.casos.length < 3) quejas.push(`${p.id}: menos de 3 casos (${p.casos.length})`);
  if (!p.casos.some((c) => c.oculto)) quejas.push(`${p.id}: no tiene ningún caso oculto`);
  if (!p.casos.some((c) => !c.oculto)) quejas.push(`${p.id}: no tiene ningún caso visible`);
  if (!p.columnas.trim()) quejas.push(`${p.id}: no dice qué columnas se piden`);
  if (p.pistas.some((x) => !x.trim())) quejas.push(`${p.id}: hay una pista vacía`);
  if (p.casos.some((c) => !c.prepara.trim())) quejas.push(`${p.id}: hay un caso sin siembra`);

  const siembras = new Set(p.casos.map((c) => c.prepara.replace(/\s+/g, ' ').trim()));
  if (siembras.size !== p.casos.length) quejas.push(`${p.id}: dos casos tienen la misma siembra`);

  if (/\bSELECT\b/i.test(p.enunciado)) quejas.push(`${p.id}: el enunciado lleva un SELECT dentro (eso es dictar la solución)`);

  for (const c of p.casos) {
    const m = baseDe(c);
    if (!m.ok) quejas.push(`${p.id}: ${m.queja}`);
  }
  return quejas;
}
