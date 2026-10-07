/**
 * El juez (M2) y los seis problemas de `n10-problemas-de-concurso`.
 *
 * Esta prueba es **la medida**, no un trámite. Lo que comprueba, en orden de
 * importancia:
 *
 * 1. **Las salidas literales de los problemas son las que salen.** Cada
 *    problema se juzga con una solución de referencia escrita aquí —aquí, que
 *    es un archivo de pruebas y no llega al navegador— y tiene que salir
 *    ACEPTADO en todos sus casos. Un literal mal copiado es un problema
 *    imposible, y un problema imposible no se ve hasta que un alumno se
 *    atasca.
 * 2. **Cada señuelo falla, y falla en el caso oculto que lo caza.** Es la
 *    dirección que casi nunca se prueba y la que de verdad sostiene el diseño:
 *    si el señuelo de `es_primo` —el bucle ingenuo que dice que el 1 es primo—
 *    aprobara, los casos ocultos serían decoración. Ver `trampas-de-jsdom`: la
 *    prueba verde y vacía.
 * 3. **El juez se porta bien en los tres casos raros**: el programa que no
 *    define la función, el que no termina y el que pide teclado.
 * 4. **Un caso oculto no filtra su contenido** ni siquiera dentro del objeto
 *    del veredicto.
 * 5. **`revisarProblema` caza los problemas mal escritos**, que es la puerta
 *    por la que volvería a entrar el ejercicio dictado.
 */

import {
  PASOS_DEL_JUEZ,
  aceptado,
  anotar,
  explicarDiferencia,
  iguales,
  juzgar,
  limpiarRegistro,
  normalizar,
  revisarProblema,
  type Problema,
} from '@/components/simuladores/juez';
import { P1, P2, P3, P4, P5, P6, PROBLEMAS } from '@/components/activities/n10/problemas-de-concurso/problemas';

/* ── las soluciones de referencia ───────────────────────────────────────────*/

const py = (...lineas: string[]) => lineas.join('\n');

const SOLUCION: Readonly<Record<string, string>> = {
  [P1.id]: py(
    'def avanzan(puntajes):',
    '    n = 0',
    '    for p in puntajes:',
    '        if p >= 70:',
    '            n = n + 1',
    '    return n',
  ),
  [P2.id]: py(
    'def mejor(tiempos):',
    '    if len(tiempos) == 0:',
    '        return -1',
    '    m = tiempos[0]',
    '    for t in tiempos:',
    '        if t < m:',
    '            m = t',
    '    return m',
  ),
  [P3.id]: py(
    'def al_reves(ids):',
    '    salida = []',
    '    for i in range(len(ids) - 1, -1, -1):',
    '        salida.append(ids[i])',
    '    return salida',
  ),
  [P4.id]: py(
    'def suma_digitos(folio):',
    '    n = folio',
    '    s = 0',
    '    while n > 0:',
    '        s = s + n % 10',
    '        n = n // 10',
    '    return s',
  ),
  [P5.id]: py(
    'def es_primo(n):',
    '    if n < 2:',
    '        return False',
    '    i = 2',
    '    while i * i <= n:',
    '        if n % i == 0:',
    '            return False',
    '        i = i + 1',
    '    return True',
  ),
  [P6.id]: py(
    'def campeon(nombres, puntos):',
    '    mejor = 0',
    '    for i in range(len(puntos)):',
    '        if puntos[i] > puntos[mejor]:',
    '            mejor = i',
    '    return nombres[mejor]',
  ),
};

/**
 * Un señuelo por problema, con el nombre del caso que tiene que cazarlo.
 *
 * No son errores inventados: son los seis que un alumno de bachillerato comete
 * de verdad la primera vez —el `>` por `>=`, el mínimo que arranca en cero, el
 * «al revés» que se come los repetidos, el `while` que para en el primer cero,
 * el primo ingenuo que asciende al 1, y el desempate que se queda con el
 * último—.
 */
const SENUELO: { problema: Problema; fuente: string; cazadoPor: string }[] = [
  {
    problema: P1,
    cazadoPor: 'justo en el corte',
    fuente: py(
      'def avanzan(puntajes):',
      '    n = 0',
      '    for p in puntajes:',
      '        if p > 70:',
      '            n = n + 1',
      '    return n',
    ),
  },
  {
    problema: P2,
    cazadoPor: 'la carrera se canceló',
    fuente: py(
      'def mejor(tiempos):',
      '    m = tiempos[0]',
      '    for t in tiempos:',
      '        if t < m:',
      '            m = t',
      '    return m',
    ),
  },
  {
    problema: P3,
    cazadoPor: 'con folios repetidos',
    fuente: py(
      'def al_reves(ids):',
      '    salida = []',
      '    for i in range(len(ids) - 1, -1, -1):',
      '        if ids[i] not in salida:',
      '            salida.append(ids[i])',
      '    return salida',
    ),
  },
  {
    problema: P4,
    cazadoPor: 'con ceros dentro',
    fuente: py(
      'def suma_digitos(folio):',
      '    n = folio',
      '    s = 0',
      '    while n % 10 > 0:',
      '        s = s + n % 10',
      '        n = n // 10',
      '    return s',
    ),
  },
  {
    problema: P5,
    cazadoPor: 'la mesa 1',
    fuente: py(
      'def es_primo(n):',
      '    for i in range(2, n):',
      '        if n % i == 0:',
      '            return False',
      '    return True',
    ),
  },
  {
    problema: P6,
    cazadoPor: 'empate de tres',
    fuente: py(
      'def campeon(nombres, puntos):',
      '    mejor = 0',
      '    for i in range(len(puntos)):',
      '        if puntos[i] >= puntos[mejor]:',
      '            mejor = i',
      '    return nombres[mejor]',
    ),
  },
];

beforeEach(() => limpiarRegistro());

/* ── 1 · los seis problemas son resolubles ──────────────────────────────────*/

describe('los seis problemas del torneo', () => {
  test.each(PROBLEMAS.map((p) => [p.titulo, p] as const))('%s se acepta con una solución correcta', (_t, p) => {
    const v = juzgar(p, SOLUCION[p.id]);
    const fallidos = v.casos.filter((c) => c.clase !== 'pasa').map((c) => `${c.nombre}: ${c.explicacion}`);
    expect(fallidos).toEqual([]);
    expect(v.aceptado).toBe(true);
    expect(v.pasados).toBe(v.total);
  });

  test('todos tienen casos ocultos, y más de uno visible entre todos', () => {
    for (const p of PROBLEMAS) {
      expect(revisarProblema(p)).toEqual([]);
      expect(p.casos.some((c) => c.oculto)).toBe(true);
    }
    /* La mitad larga del torneo está oculta: 20 de 29 casos. Si alguien rebaja
     * eso, el problema vuelve a poder resolverse mirando los ejemplos. */
    const todos = PROBLEMAS.flatMap((p) => p.casos);
    expect(todos.filter((c) => c.oculto).length).toBeGreaterThan(todos.length / 2);
  });

  test('ningún enunciado lleva la solución dentro', () => {
    for (const p of PROBLEMAS) {
      expect(p.enunciado).not.toMatch(/\bfor\b|\bwhile\b|\bappend\b|\brange\b|==|\bprint\b/);
      expect(p.pistas[0]).not.toMatch(/\bdef\b|\breturn\b/);
    }
  });
});

/* ── 2 · los señuelos fallan, y fallan donde deben ──────────────────────────*/

describe('los señuelos', () => {
  test.each(SENUELO.map((s) => [s.problema.titulo, s] as const))('%s: el error típico NO se acepta', (_t, s) => {
    const v = juzgar(s.problema, s.fuente);
    expect(v.aceptado).toBe(false);

    const cazador = v.casos.find((c) => c.nombre === s.cazadoPor);
    expect(cazador).toBeDefined();
    expect(cazador?.clase).not.toBe('pasa');
  });

  test('el señuelo del corte pasa TODOS los visibles y sólo cae en el oculto', () => {
    /* Éste es el que demuestra para qué sirven los casos ocultos: con sólo los
     * visibles, el `>` por `>=` aprobaría. */
    const v = juzgar(P1, SENUELO[0].fuente);
    const visibles = v.casos.filter((c) => !c.oculto);
    expect(visibles.every((c) => c.clase === 'pasa')).toBe(true);
    expect(v.aceptado).toBe(false);
  });

  test('el primo ingenuo asciende al uno y sólo el caso oculto lo ve', () => {
    const v = juzgar(P5, SENUELO[4].fuente);
    expect(v.casos.filter((c) => !c.oculto).every((c) => c.clase === 'pasa')).toBe(true);
    expect(v.casos.find((c) => c.nombre === 'la mesa 1')?.clase).toBe('falla');
  });

  test('copiar la respuesta del ejemplo no aprueba nada', () => {
    const v = juzgar(P1, py('def avanzan(puntajes):', '    return 4'));
    expect(v.aceptado).toBe(false);
    expect(v.pasados).toBe(1);
  });
});

/* ── 3 · los casos raros ────────────────────────────────────────────────────*/

describe('el juez ante lo raro', () => {
  test('un programa que no define la función lo dice con esas palabras', () => {
    const v = juzgar(P1, py('# todavía no escribí nada'));
    expect(v.aceptado).toBe(false);
    expect(v.casos[0].clase).toBe('error');
    expect(v.casos[0].explicacion).toContain('no la define con ese nombre');
    /* Y NO le lleva el cursor a una línea: el tropiezo no es de su programa. */
    expect(v.casos[0].linea).toBeUndefined();
  });

  test('un bucle infinito es «no termina», no un error', () => {
    const v = juzgar(P1, py('def avanzan(puntajes):', '    while True:', '        n = 1'));
    expect(v.casos[0].clase).toBe('no-termina');
    expect(v.casos[0].explicacion).toContain('no terminó');
    expect(v.casos[0].explicacion).toContain(PASOS_DEL_JUEZ.toLocaleString('es-MX'));
  });

  test('pedir datos por teclado tiene su propio veredicto', () => {
    const v = juzgar(P1, py('def avanzan(puntajes):', '    x = input()', '    return 0'));
    expect(v.casos[0].clase).toBe('pregunta');
    expect(v.casos[0].explicacion).toContain('input');
  });

  test('un print de depuración NO tumba el caso, pero se avisa', () => {
    const conRuido = py('print("probando")', SOLUCION[P1.id]);
    const v = juzgar(P1, conRuido);
    expect(v.aceptado).toBe(true);
    expect(v.casos[0].ruido).toEqual(['probando']);
  });

  test('un error dentro del programa del alumno sí señala su línea', () => {
    const v = juzgar(P1, py('def avanzan(puntajes):', '    return puntajes[99]'));
    expect(v.casos[0].clase).toBe('error');
    expect(v.casos[0].linea).toBe(2);
  });
});

/* ── 4 · lo oculto no se filtra ─────────────────────────────────────────────*/

describe('el tachado de los casos ocultos', () => {
  test('un caso oculto no lleva su salida ni la esperada, ni pasando ni fallando', () => {
    for (const fuente of [SOLUCION[P1.id], SENUELO[0].fuente]) {
      const v = juzgar(P1, fuente);
      for (const c of v.casos.filter((x) => x.oculto)) {
        expect(c.esperada).toBeNull();
        expect(c.obtenida).toBeNull();
        expect(c.ruido).toEqual([]);
        /* Y la explicación no puede llevar dentro ningún número del caso. */
        expect(c.explicacion).not.toMatch(/\d/);
      }
    }
  });

  test('un caso visible sí las lleva: es el material con el que el alumno corrige', () => {
    const v = juzgar(P1, SENUELO[0].fuente);
    const visible = v.casos.find((c) => !c.oculto && c.clase !== 'pasa');
    /* El señuelo del corte pasa los dos visibles, así que se usa otro. */
    const otro = juzgar(P1, py('def avanzan(puntajes):', '    return 99'));
    const v2 = otro.casos.find((c) => !c.oculto);
    expect(visible ?? v2).toBeDefined();
    expect(v2?.esperada).toEqual(['4']);
    expect(v2?.obtenida).toEqual(['99']);
    expect(v2?.explicacion).toContain('99');
  });
});

/* ── 5 · el revisor de problemas ────────────────────────────────────────────*/

describe('revisarProblema', () => {
  const base: Problema = {
    id: 'x',
    titulo: 'X',
    enunciado: 'Devuelve cuántos pasan.',
    firma: 'f(a) → un número',
    casos: [
      { nombre: 'a', llamada: 'print(f(1))', esperada: ['1'] },
      { nombre: 'b', llamada: 'print(f(2))', esperada: ['2'] },
      { nombre: 'c', llamada: 'print(f(3))', esperada: ['3'], oculto: true },
    ],
    pistas: ['una', 'dos', 'tres'],
  };

  test('un problema bien escrito no tiene quejas', () => {
    expect(revisarProblema(base)).toEqual([]);
  });

  test('sin casos ocultos, se queja', () => {
    const malo = { ...base, casos: base.casos.map((c) => ({ ...c, oculto: false })) };
    expect(revisarProblema(malo).join(' ')).toContain('ningún caso oculto');
  });

  test('dos casos con la misma llamada, se queja', () => {
    const malo = { ...base, casos: [...base.casos, { ...base.casos[0], nombre: 'd' }] };
    expect(revisarProblema(malo).join(' ')).toContain('la misma llamada');
  });

  test('un enunciado que dicta la solución, se queja', () => {
    const malo = { ...base, enunciado: 'Escribe avanzan = avanzan + 1 dentro del if.' };
    expect(revisarProblema(malo).join(' ')).toContain('dictar la solución');
  });
});

/* ── 6 · la comparación de líneas ───────────────────────────────────────────*/

describe('la comparación', () => {
  test('el blanco de la derecha y las líneas vacías del final no cuentan', () => {
    expect(normalizar(['5  ', '', ''])).toEqual(['5']);
    expect(iguales(['5 '], ['5'])).toBe(true);
    /* Pero el blanco de DENTRO sí: son respuestas distintas. */
    expect(iguales([' 5'], ['5'])).toBe(false);
  });

  test('las explicaciones se pueden leer en voz alta', () => {
    expect(explicarDiferencia(['7'], ['5'])).toBe('la respuesta dice «7» y tenía que decir «5»');
    expect(explicarDiferencia(['a', 'x'], ['a', 'b'])).toBe('la línea 2 dice «x» y tenía que decir «b»');
    expect(explicarDiferencia(['a', 'b', 'c'], ['a', 'b'])).toBe('sobra una línea al final: «c»');
    expect(explicarDiferencia(['a'], ['a', 'b'])).toBe('falta la última línea');
    expect(explicarDiferencia([], ['a'])).toContain('no imprimió nada');
  });
});

/* ── 7 · el tablero ─────────────────────────────────────────────────────────*/

describe('el registro', () => {
  test('el veredicto va atado al texto con el que se consiguió', () => {
    const fuente = SOLUCION[P1.id];
    anotar(juzgar(P1, fuente), fuente);
    expect(aceptado(P1.id, fuente)).toBe(true);
    /* Cambiar una letra y preguntar otra vez ya no vale: el siguiente problema
     * no hereda el «sí» del anterior. */
    expect(aceptado(P1.id, `${fuente}\n`)).toBe(false);
    expect(aceptado(P2.id, fuente)).toBe(false);
  });

  test('limpiar el registro lo vacía', () => {
    const fuente = SOLUCION[P1.id];
    anotar(juzgar(P1, fuente), fuente);
    limpiarRegistro();
    expect(aceptado(P1.id, fuente)).toBe(false);
  });
});
