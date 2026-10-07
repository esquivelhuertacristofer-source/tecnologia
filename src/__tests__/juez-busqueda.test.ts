/**
 * El juez y los seis problemas de `n9-busqueda-y-ordenamiento` (§68.2).
 *
 * Gemela de `juez-y-concurso.test.ts`:
 *
 * 1. **Las salidas literales son las del intérprete.** Cada problema se juzga
 *    con una solución de referencia escrita aquí —aquí, que no llega al
 *    navegador— y tiene que salir ACEPTADO.
 * 2. **Cada señuelo pasa TODO lo visible y cae en un oculto.** Si un señuelo
 *    cayera ya en un ejemplo visible, el caso oculto no estaría haciendo ningún
 *    trabajo: es la lección del 70 de §68, convertida en prueba.
 * 3. **`sorted()` no aprueba el burbuja.** Es la razón de que cuatro problemas
 *    devuelvan un número de trabajo y no sólo un resultado.
 */

import { juzgar, limpiarRegistro, revisarProblema, type Problema } from '@/components/simuladores/juez';
import { B1, B2, B3, B4, B5, B6, PROBLEMAS_BUSQUEDA } from '@/components/activities/datos/problemasBusqueda';

const py = (...l: string[]) => l.join('\n');

const REFERENCIA: Readonly<Record<string, string>> = {
  [B1.id]: py(
    'def posicion(canciones, titulo):',
    '    for i in range(len(canciones)):',
    '        if canciones[i] == titulo:',
    '            return i',
    '    return -1',
  ),
  [B2.id]: py(
    'def comparaciones(canciones, titulo):',
    '    n = 0',
    '    for c in canciones:',
    '        n = n + 1',
    '        if c == titulo:',
    '            return n',
    '    return n',
  ),
  [B3.id]: py(
    'def comparaciones_ordenada(numeros, objetivo):',
    '    n = 0',
    '    for x in numeros:',
    '        n = n + 1',
    '        if x >= objetivo:',
    '            return n',
    '    return n',
  ),
  [B4.id]: py(
    'def una_pasada(numeros):',
    '    l = numeros[:]',
    '    for i in range(len(l) - 1):',
    '        if l[i] > l[i + 1]:',
    '            l[i], l[i + 1] = l[i + 1], l[i]',
    '    return l',
  ),
  [B5.id]: py(
    'def burbuja(numeros):',
    '    l = numeros[:]',
    '    cambios = 0',
    '    for pasada in range(len(l) - 1):',
    '        for i in range(len(l) - 1 - pasada):',
    '            if l[i] > l[i + 1]:',
    '                l[i], l[i + 1] = l[i + 1], l[i]',
    '                cambios = cambios + 1',
    '    return [l, cambios]',
  ),
  [B6.id]: py(
    'def pasadas(numeros):',
    '    l = numeros[:]',
    '    n = 0',
    '    hubo = True',
    '    while hubo:',
    '        hubo = False',
    '        n = n + 1',
    '        for i in range(len(l) - 1):',
    '            if l[i] > l[i + 1]:',
    '                l[i], l[i + 1] = l[i + 1], l[i]',
    '                hubo = True',
    '    return n',
  ),
};

/** El error típico de cada problema: el que su tabla de §68.2 dice que caza un oculto. */
const SENUELO: { problema: Problema; porque: string; fuente: string }[] = [
  {
    problema: B1,
    porque: 'se queda con la última coincidencia',
    fuente: py(
      'def posicion(canciones, titulo):',
      '    lugar = -1',
      '    for i in range(len(canciones)):',
      '        if canciones[i] == titulo:',
      '            lugar = i',
      '    return lugar',
    ),
  },
  {
    problema: B2,
    porque: 'devuelve 0 cuando no está',
    fuente: py(
      'def comparaciones(canciones, titulo):',
      '    n = 0',
      '    for c in canciones:',
      '        n = n + 1',
      '        if c == titulo:',
      '            return n',
      '    return 0',
    ),
  },
  {
    problema: B3,
    porque: 'para sólo con «mayor que»',
    fuente: py(
      'def comparaciones_ordenada(numeros, objetivo):',
      '    n = 0',
      '    for x in numeros:',
      '        n = n + 1',
      '        if x > objetivo:',
      '            return n',
      '    return n',
    ),
  },
  {
    problema: B4,
    porque: 'recorre un par de menos',
    fuente: py(
      'def una_pasada(numeros):',
      '    l = numeros[:]',
      '    for i in range(len(l) - 2):',
      '        if l[i] > l[i + 1]:',
      '            l[i], l[i + 1] = l[i + 1], l[i]',
      '    return l',
    ),
  },
  {
    problema: B5,
    porque: 'intercambia también los iguales',
    fuente: py(
      'def burbuja(numeros):',
      '    l = numeros[:]',
      '    cambios = 0',
      '    for pasada in range(len(l) - 1):',
      '        for i in range(len(l) - 1 - pasada):',
      '            if l[i] >= l[i + 1]:',
      '                l[i], l[i + 1] = l[i + 1], l[i]',
      '                cambios = cambios + 1',
      '    return [l, cambios]',
    ),
  },
  {
    problema: B6,
    porque: 'cuenta siempre n − 1 pasadas',
    fuente: py('def pasadas(numeros):', '    return len(numeros) - 1'),
  },
];

beforeEach(() => limpiarRegistro());

describe('los seis problemas de la lista de reproducción', () => {
  test.each(PROBLEMAS_BUSQUEDA.map((p) => [p.titulo, p] as const))('%s se acepta con la referencia', (_t, p) => {
    const v = juzgar(p, REFERENCIA[p.id]);
    expect(v.casos.filter((c) => c.clase !== 'pasa').map((c) => `${c.nombre}: ${c.explicacion}`)).toEqual([]);
    expect(v.aceptado).toBe(true);
  });

  test('las seis referencias conviven en un mismo archivo y siguen aceptadas', () => {
    const todo = PROBLEMAS_BUSQUEDA.map((p) => REFERENCIA[p.id]).join('\n\n');
    for (const p of PROBLEMAS_BUSQUEDA) expect(juzgar(p, todo).aceptado).toBe(true);
  });

  test('todos están bien escritos, con más ocultos que visibles', () => {
    for (const p of PROBLEMAS_BUSQUEDA) {
      expect(revisarProblema(p)).toEqual([]);
      const ocultos = p.casos.filter((c) => c.oculto).length;
      expect(ocultos).toBeGreaterThan(p.casos.length - ocultos);
    }
  });

  test('ningún enunciado ni ninguna de las dos primeras pistas dicta código', () => {
    for (const p of PROBLEMAS_BUSQUEDA) {
      const texto = `${p.enunciado} ${p.pistas[0]} ${p.pistas[1]}`;
      expect(texto).not.toMatch(/\bfor\b|\bwhile\b|\brange\b|\bdef\b|\breturn\b|==|\[i\]|len\(/);
    }
  });

  test('los nombres de los casos ocultos no llevan cifras', () => {
    for (const p of PROBLEMAS_BUSQUEDA) for (const c of p.casos.filter((x) => x.oculto)) expect(c.nombre).not.toMatch(/\d/);
  });
});

describe('los señuelos', () => {
  test.each(SENUELO.map((s) => [`${s.problema.titulo} — ${s.porque}`, s] as const))(
    '%s pasa todo lo visible y cae en un oculto',
    (_t, s) => {
      const v = juzgar(s.problema, s.fuente);
      const visibles = v.casos.filter((c) => !c.oculto);
      expect(visibles.map((c) => `${c.nombre}:${c.clase}`)).toEqual(visibles.map((c) => `${c.nombre}:pasa`));
      expect(v.casos.some((c) => c.oculto && c.clase !== 'pasa')).toBe(true);
      expect(v.aceptado).toBe(false);
    },
  );

  test('resolver el burbuja con sorted() no aprueba: el conteo lo tumba', () => {
    const v = juzgar(B5, py('def burbuja(numeros):', '    return [sorted(numeros), 0]'));
    expect(v.aceptado).toBe(false);
    expect(v.casos[0].clase).toBe('falla');
  });

  test('una bandera que nunca se apaga da «no termina», no cuelga', () => {
    const v = juzgar(
      B6,
      py('def pasadas(numeros):', '    n = 0', '    hubo = True', '    while hubo:', '        n = n + 1', '    return n'),
    );
    expect(v.casos[0].clase).toBe('no-termina');
    expect(v.aceptado).toBe(false);
  });

  test('recorrer un par de más revienta con un error de índice explicado', () => {
    const v = juzgar(
      B4,
      py(
        'def una_pasada(numeros):',
        '    l = numeros[:]',
        '    for i in range(len(l)):',
        '        if l[i] > l[i + 1]:',
        '            l[i], l[i + 1] = l[i + 1], l[i]',
        '    return l',
      ),
    );
    expect(v.casos[0].clase).toBe('error');
    expect(v.casos[0].linea).toBe(4);
  });
});
