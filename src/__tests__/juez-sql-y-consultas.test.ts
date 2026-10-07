/**
 * El juez de SQL y los siete problemas de `n10-consultas-sql`.
 *
 * Gemela de `juez-y-concurso.test.ts`, y con el mismo reparto de pesos:
 *
 * 1. **Las 21 tablas literales son las que devuelve el motor.** Cada problema
 *    se juzga con una consulta de referencia escrita aquí —aquí, que no llega
 *    al navegador— y tiene que salir ACEPTADO en sus tres casos.
 * 2. **Cada señuelo falla.** Y el del problema 7 es el que justifica todo el
 *    diseño: `WHERE equipos.id = 1` **pasa el caso visible** —en el club de
 *    este año «Los Circuitos» es el equipo 1— y sólo lo tumba una siembra
 *    oculta donde ese mismo equipo lleva otro número.
 * 3. **Las siembras cumplen sus condiciones.** Si alguien alfabetiza una, el
 *    problema 1 vuelve a regalarse y nadie se entera: es exactamente lo que
 *    pasó antes del 2-sep-2026.
 * 4. **La base del editor y la del caso visible son la misma.** Un juez que
 *    corriera sobre otros datos que los de la pantalla del alumno le enseñaría
 *    a desconfiar de él.
 */

import { juzgarSql, limpiarRegistro, revisarProblemaSql, type ProblemaSql } from '@/components/simuladores/juez';
import { BASE_VACIA, aMatriz, ejecutar } from '@/components/simuladores/datos';
import {
  BASE_CLUB,
  SIEMBRA_CLUB,
  SIEMBRA_CLUB_CHICO,
  SIEMBRA_OTRO_CURSO,
  baseDeSiembra,
} from '@/components/activities/datos/siembrasClub';
import { PROBLEMAS_SQL, S1, S2, S3, S4, S5, S6, S7 } from '@/components/activities/datos/problemasSql';

/* ── las consultas de referencia ────────────────────────────────────────────*/

const REFERENCIA: Readonly<Record<string, string>> = {
  [S1.id]: 'SELECT nombre, grado FROM integrantes ORDER BY nombre;',
  [S2.id]: 'SELECT nombre FROM integrantes WHERE grado = 3 ORDER BY nombre DESC;',
  [S3.id]: "SELECT nombre FROM integrantes WHERE nombre LIKE 'A%';",
  [S4.id]: 'SELECT nombre, grado FROM integrantes ORDER BY grado DESC, nombre LIMIT 3;',
  [S5.id]:
    'SELECT integrantes.nombre, equipos.nombre AS equipo FROM integrantes JOIN equipos ON integrantes.equipo_id = equipos.id;',
  [S6.id]: 'SELECT nombre FROM integrantes WHERE equipo_id IS NULL;',
  [S7.id]:
    "SELECT integrantes.nombre FROM integrantes JOIN equipos ON integrantes.equipo_id = equipos.id WHERE equipos.nombre = 'Los Circuitos';",
};

/**
 * Un señuelo por problema: el error que un alumno de bachillerato comete de
 * verdad la primera vez, no uno inventado.
 */
const SENUELO: { problema: ProblemaSql; sql: string; porque: string }[] = [
  { problema: S1, porque: 'sin ORDER BY', sql: 'SELECT nombre, grado FROM integrantes;' },
  { problema: S2, porque: 'ordenado al derecho', sql: 'SELECT nombre FROM integrantes WHERE grado = 3 ORDER BY nombre;' },
  /* El señuelo del 3 es el `=` en lugar del `LIKE`, que es justo contra lo que
   * avisa su primera pista. **No** es la «a» en minúscula: ese era el señuelo
   * de la primera versión de esta prueba y fue aceptado con razón —ver el
   * comentario de la tercera pista de S3—. */
  { problema: S3, porque: 'un igual en vez de un LIKE', sql: "SELECT nombre FROM integrantes WHERE nombre = 'A%';" },
  { problema: S4, porque: 'sin desempate', sql: 'SELECT nombre, grado FROM integrantes ORDER BY grado DESC LIMIT 3;' },
  {
    problema: S5,
    porque: 'columna ambigua',
    sql: 'SELECT nombre, nombre FROM integrantes JOIN equipos ON integrantes.equipo_id = equipos.id;',
  },
  { problema: S6, porque: 'igual a NULL', sql: 'SELECT nombre FROM integrantes WHERE equipo_id = NULL;' },
  {
    problema: S7,
    porque: 'filtrando por el número de equipo',
    sql: 'SELECT integrantes.nombre FROM integrantes JOIN equipos ON integrantes.equipo_id = equipos.id WHERE equipos.id = 1;',
  },
];

beforeEach(() => limpiarRegistro());

/* ── 1 · los siete problemas son resolubles ─────────────────────────────────*/

describe('los siete problemas del club', () => {
  test.each(PROBLEMAS_SQL.map((p) => [p.titulo, p] as const))('%s se acepta con la consulta correcta', (_t, p) => {
    const v = juzgarSql(p, REFERENCIA[p.id]);
    const fallidos = v.casos.filter((c) => c.clase !== 'pasa').map((c) => `${c.nombre}: ${c.explicacion}`);
    expect(fallidos).toEqual([]);
    expect(v.aceptado).toBe(true);
  });

  test('todos están bien escritos y tienen casos ocultos de sobra', () => {
    for (const p of PROBLEMAS_SQL) expect(revisarProblemaSql(p)).toEqual([]);
    const todos = PROBLEMAS_SQL.flatMap((p) => p.casos);
    expect(todos).toHaveLength(21);
    expect(todos.filter((c) => c.oculto)).toHaveLength(14);
  });

  test('ningún enunciado lleva la consulta dentro', () => {
    for (const p of PROBLEMAS_SQL) {
      expect(p.enunciado).not.toMatch(/\bSELECT\b|\bORDER BY\b|\bWHERE\b|\bJOIN\b|\bLIKE\b|\bLIMIT\b|\bNULL\b/i);
      /* Las dos primeras pistas tampoco: la tercera dice el método, nunca el
       * código, y por eso puede nombrar una cláusula sin escribirla. */
      expect(`${p.pistas[0]} ${p.pistas[1]}`).not.toMatch(/\bSELECT\b|\bORDER BY\b|\bJOIN\b/i);
    }
  });
});

/* ── 2 · los señuelos ───────────────────────────────────────────────────────*/

describe('los señuelos', () => {
  test.each(SENUELO.map((s) => [`${s.problema.titulo} — ${s.porque}`, s] as const))('%s NO se acepta', (_t, s) => {
    const v = juzgarSql(s.problema, s.sql);
    expect(v.aceptado).toBe(false);
  });

  test('el atajo del problema 7 pasa el caso VISIBLE y lo tumba uno oculto', () => {
    /* El que justifica el diseño entero: con sólo el caso visible, filtrar por
     * el número de equipo aprobaría, y el alumno se iría creyendo que un
     * identificador interno es un nombre. */
    const v = juzgarSql(S7, SENUELO[6].sql);
    expect(v.casos.filter((c) => !c.oculto).every((c) => c.clase === 'pasa')).toBe(true);
    expect(v.aceptado).toBe(false);
    expect(v.casos.filter((c) => c.oculto && c.clase !== 'pasa').length).toBeGreaterThan(0);
  });

  test('la columna ambigua es un veredicto explicado, no una caída', () => {
    const v = juzgarSql(S5, SENUELO[4].sql);
    expect(v.casos[0].clase).toBe('error');
    expect(v.casos[0].explicacion.toLowerCase()).toMatch(/ambigua|no sé de cuál|dos tablas/);
  });

  test('«= NULL» no devuelve nada y el veredicto lo dice sin jerga', () => {
    const v = juzgarSql(S6, SENUELO[5].sql);
    expect(v.casos[0].clase).toBe('falla');
    expect(v.casos[0].explicacion).toMatch(/no devolvió ninguna fila/);
  });

  test('LIKE no distingue mayúsculas, y la tercera pista del 3 dice eso y no lo contrario', () => {
    /* El motor compila el patrón con la bandera `i` a propósito
     * (`modelo.ts:297`, «como SQLite»). Si alguien se la quita, esta prueba cae
     * y la pista deja de ser cierta: por eso la pista se comprueba aquí. */
    expect(juzgarSql(S3, "SELECT nombre FROM integrantes WHERE nombre LIKE 'a%';").aceptado).toBe(true);
    expect(S3.pistas[2]).toMatch(/Mayúsculas y minúsculas dan igual/);
    expect(S3.pistas[2]).not.toMatch(/A mayúscula/);
  });

  test('copiar las filas del ejemplo no es siquiera posible: hay que devolverlas', () => {
    /* No hay forma de «pegar la respuesta» en SQL sin inventarse una consulta
     * que produzca esas filas; la más cercana es un filtro por los nombres del
     * ejemplo, y ésa cae en cuanto la siembra cambia. */
    const v = juzgarSql(S3, "SELECT nombre FROM integrantes WHERE nombre = 'Ana Torres' OR nombre = 'Andrés Villareal';");
    expect(v.casos.filter((c) => !c.oculto).every((c) => c.clase === 'pasa')).toBe(true);
    expect(v.aceptado).toBe(false);
  });
});

/* ── 3 · las siembras ───────────────────────────────────────────────────────*/

describe('las siembras', () => {
  const SIEMBRAS: [string, string][] = [
    ['visible', SIEMBRA_CLUB],
    ['otro curso', SIEMBRA_OTRO_CURSO],
    ['club chico', SIEMBRA_CLUB_CHICO],
  ];

  function integrantesDe(sql: string) {
    const r = ejecutar(baseDeSiembra(sql), 'SELECT nombre, grado, equipo_id FROM integrantes;');
    if (!r.ok) throw new Error(r.error.mensaje);
    return r.resultados.filter((x) => x.clase === 'consulta').at(-1)!.filas;
  }

  test.each(SIEMBRAS)('«%s» no regala ningún problema', (_n, sql) => {
    const filas = integrantesDe(sql);
    const nombres = filas.map((f) => String(f[0]));

    /* Si vinieran ya ordenados, el problema 1 se aprueba sin ORDER BY. */
    const yaOrdenados = nombres.every((n, i) => i === 0 || nombres[i - 1].localeCompare(n, 'es') <= 0);
    expect(yaOrdenados).toBe(false);

    /* Si los de grado 3 vinieran ya de la Z a la A, el problema 2 igual. */
    const g3 = filas.filter((f) => f[1] === 3).map((f) => String(f[0]));
    const yaDesc = g3.every((n, i) => i === 0 || g3[i - 1].localeCompare(n, 'es') >= 0);
    expect(yaDesc).toBe(false);

    /* Los problemas 3 y 6 necesitan a quién filtrar. */
    expect(nombres.filter((n) => n.startsWith('A')).length).toBeGreaterThan(0);
    expect(nombres.filter((n) => !n.startsWith('A')).length).toBeGreaterThan(0);
    expect(filas.filter((f) => f[2] === null).length).toBeGreaterThan(0);
  });

  test('«Los Circuitos» existe en las tres y con gente distinta en cada una', () => {
    const plantillas = SIEMBRAS.map(([, sql]) => {
      const r = ejecutar(baseDeSiembra(sql), REFERENCIA[S7.id]);
      if (!r.ok) throw new Error(r.error.mensaje);
      return r.resultados
        .filter((x) => x.clase === 'consulta')
        .at(-1)!
        .filas.map((f) => String(f[0]))
        .sort()
        .join('|');
    });
    expect(new Set(plantillas).size).toBe(3);
    expect(plantillas.every((p) => p.length > 0)).toBe(true);
  });

  test('el número de «Los Circuitos» NO es el mismo en todas: por eso el atajo cae', () => {
    const ids = SIEMBRAS.map(([, sql]) => {
      const r = ejecutar(baseDeSiembra(sql), "SELECT id FROM equipos WHERE nombre = 'Los Circuitos';");
      if (!r.ok) throw new Error(r.error.mensaje);
      return r.resultados.filter((x) => x.clase === 'consulta').at(-1)!.filas[0][0];
    });
    expect(new Set(ids).size).toBeGreaterThan(1);
  });
});

/* ── 4 · una sola fuente de verdad ──────────────────────────────────────────*/

describe('la base del editor y la del juez', () => {
  test('son la misma, tabla por tabla y fila por fila', () => {
    const delJuez = baseDeSiembra(SIEMBRA_CLUB);
    expect(BASE_CLUB.tablas.map((t) => t.nombre)).toEqual(delJuez.tablas.map((t) => t.nombre));
    for (const t of BASE_CLUB.tablas) {
      const otra = delJuez.tablas.find((x) => x.nombre === t.nombre)!;
      expect(t.filas).toEqual(otra.filas);
    }
  });

  test('la siembra monta las tres tablas, con las 150 sesiones', () => {
    const r = ejecutar(BASE_VACIA, SIEMBRA_CLUB);
    expect(r.ok).toBe(true);
    const conteo = ejecutar(baseDeSiembra(SIEMBRA_CLUB), 'SELECT id FROM sesiones;');
    if (!conteo.ok) throw new Error(conteo.error.mensaje);
    const filas = conteo.resultados.filter((x) => x.clase === 'consulta').at(-1)!.filas;
    expect(filas).toHaveLength(150);
    /* Y todas con fecha válida: el motor valida el calendario, y el reparto
     * ingenuo «mes = i/30» pedía un 29 de febrero de 2026. */
    const fechas = ejecutar(baseDeSiembra(SIEMBRA_CLUB), 'SELECT fecha FROM sesiones ORDER BY fecha;');
    expect(fechas.ok).toBe(true);
  });

  test('aMatriz devuelve encabezados y filas, que es lo que el panel pinta', () => {
    const r = ejecutar(BASE_CLUB, REFERENCIA[S6.id]);
    if (!r.ok) throw new Error(r.error.mensaje);
    const m = aMatriz(r.resultados.filter((x) => x.clase === 'consulta').at(-1)!);
    expect(m[0]).toEqual(['nombre']);
    expect(m.slice(1)).toEqual([['Fernando Ibarra']]);
  });
});
