/**
 * Los tres problemas de «Retos guiados» sobre el juez de programas (§69.18).
 *
 * Las salidas literales vuelven a medirse con el intérprete (se midieron
 * primero con CPython, `scratchpad/n7/medir-retos.py`), cada señuelo de la
 * tabla de §69.18 cae donde CPython dijo, y cada ficha del manual se ejecuta.
 */

import { ejecutar } from '@/components/simuladores/codigo/maquina';
import { juzgarPrograma, revisarProblemaPrograma, type ProblemaPrograma } from '@/components/simuladores/juez';
import { CELDAS_RETOS, MANUAL_RETOS, PROBLEMAS_RETOS, R1, R2, R3 } from '@/components/activities/python/problemasRetos';
import { CLASE, PLANTILLA } from '@/components/activities/python/LabRetosPython';
import { recortarCelda } from '@/components/simuladores/codigo/celdas';

const py = (...l: string[]) => l.join('\n');

function enCelda(celda: string, programa: string, base = PLANTILLA): string {
  const lineas = base.split('\n');
  const i = lineas.findIndex((l) => l.startsWith(`# %% ${celda}`));
  if (i === -1) throw new Error(`no hay celda ${celda}`);
  lineas.splice(i + 1, 0, ...programa.split('\n'));
  return lineas.join('\n');
}

const REF: Record<string, string> = {
  [R1.id]: py('p = float(input("Precio: "))', 'n = int(input("Piezas: "))', 't = p * n', 'if t >= 500:', '    t = t * 0.8', 'elif t >= 100:', '    t = t * 0.9', 'print("Pagas", t, "pesos.")'),
  [R2.id]: py(
    'n = int(input())',
    'if n == 0:',
    '    print("Sin calificaciones.")',
    'else:',
    '    s = 0',
    '    a = 0',
    '    for i in range(n):',
    '        c = int(input())',
    '        s = s + c',
    '        if c >= 6:',
    '            a = a + 1',
    '    print("Aprobados:", a)',
    '    print("Promedio:", s / n)',
  ),
  [R3.id]: py(
    'intentos = 3',
    'abierto = False',
    'while intentos > 0:',
    '    c = int(input("Código: "))',
    '    if c == 47:',
    '        abierto = True',
    '        break',
    '    print("Incorrecto.")',
    '    intentos = intentos - 1',
    'if abierto:',
    '    print("¡Casillero abierto!")',
    'else:',
    '    print("Casillero bloqueado.")',
  ),
};

function caidos(p: ProblemaPrograma, programa: string): string[] {
  return juzgarPrograma(p, enCelda(p.celda as string, programa))
    .casos.filter((c) => c.clase !== 'pasa')
    .map((c) => c.nombre);
}

describe('los problemas están bien escritos y la plantilla trae sus celdas', () => {
  it.each(PROBLEMAS_RETOS.map((p) => [p.id, p] as const))('%s', (_id, p) => {
    expect(revisarProblemaPrograma(p)).toEqual([]);
    expect(recortarCelda(PLANTILLA, p.celda as string)).not.toBeNull();
  });

  it('cada encargo con celda la encuentra en la plantilla', () => {
    for (const celda of Object.values(CELDAS_RETOS)) expect(recortarCelda(PLANTILLA, celda)).not.toBeNull();
  });
});

describe('las referencias se aceptan con el intérprete', () => {
  it.each(PROBLEMAS_RETOS.map((p) => [p.id, p] as const))('%s', (id, p) => {
    expect(caidos(p, REF[id])).toEqual([]);
  });

  it('las tres juntas, cada una en su celda', () => {
    let texto = PLANTILLA;
    for (const p of PROBLEMAS_RETOS) texto = enCelda(p.celda as string, REF[p.id], texto);
    for (const p of PROBLEMAS_RETOS) expect(juzgarPrograma(p, texto).aceptado).toBe(true);
  });

  it('el 10 % escrito de otras dos maneras da lo mismo en todos los casos', () => {
    expect(caidos(R1, REF[R1.id].replace('t = t * 0.9', 't = t - t * 0.1'))).toEqual([]);
    expect(caidos(R1, REF[R1.id].replace('t = t * 0.9', 't = t - t / 10').replace('t = t * 0.8', 't = t - t / 5'))).toEqual([]);
  });

  it('otra estructura también vale: el candado preguntando al contador después del bucle', () => {
    const otro = py(
      'intentos = 3',
      'while intentos > 0:',
      '    c = int(input())',
      '    if c == 47:',
      '        print("¡Casillero abierto!")',
      '        break',
      '    print("Incorrecto.")',
      '    intentos = intentos - 1',
      'if intentos == 0:',
      '    print("Casillero bloqueado.")',
    );
    expect(caidos(R3, otro)).toEqual([]);
  });
});

describe('los señuelos caen donde dijo CPython (tabla de §69.18)', () => {
  it('1 · mayor que 100 cae en el justo 100; sin el 20 % o al revés pasan los visibles y caen en los de 500', () => {
    expect(caidos(R1, REF[R1.id].replace('t >= 100', 't > 100'))).toEqual(['cinco de a 20', 'justo 100 de otra manera']);
    const sinVeinte = py('p = float(input())', 'n = int(input())', 't = p * n', 'if t >= 100:', '    t = t * 0.9', 'print("Pagas", t, "pesos.")');
    const alReves = py('p = float(input())', 'n = int(input())', 't = p * n', 'if t >= 100:', '    t = t * 0.9', 'elif t >= 500:', '    t = t * 0.8', 'print("Pagas", t, "pesos.")');
    expect(caidos(R1, sinVeinte)).toEqual(['justo 500', 'una compra grande con decimales']);
    expect(caidos(R1, alReves)).toEqual(['justo 500', 'una compra grande con decimales']);
  });

  it('1 · int al precio revienta en el visible con decimales', () => {
    const v = juzgarPrograma(R1, enCelda('Reto 1', REF[R1.id].replace('float(input("Precio: "))', 'int(input("Precio: "))')));
    expect(v.casos[1].clase).toBe('error');
  });

  it('2 · sin revisar el grupo vacío cae SÓLO ahí y con error (la pregunta de cierre)', () => {
    const sinRevisar = py(
      'n = int(input())',
      's = 0',
      'a = 0',
      'for i in range(n):',
      '    c = int(input())',
      '    s = s + c',
      '    if c >= 6:',
      '        a = a + 1',
      'print("Aprobados:", a)',
      'print("Promedio:", s / n)',
    );
    const v = juzgarPrograma(R2, enCelda('Reto 2', sinRevisar));
    expect(v.casos.filter((c) => c.clase !== 'pasa').map((c) => [c.nombre, c.clase])).toEqual([['grupo vacío', 'error']]);
    const cierre = CLASE.guion.pasos.find((p) => p.id === 'el-grupo-vacio');
    expect(cierre?.instruccion).toContain('grupo vacío');
    expect(cierre?.logro).toMatchObject({ tipo: 'eleccion', correcta: 0 });
  });

  it('2 · mayor que 6 cae en el visible; // en todos los que tienen alumnos', () => {
    expect(caidos(R2, REF[R2.id].replace('c >= 6', 'c > 6'))).toEqual(['cuatro alumnos', 'uno con 6 justo']);
    expect(caidos(R2, REF[R2.id].replace('s / n', 's // n'))).toEqual(['cuatro alumnos', 'dos alumnos', 'uno con 6 justo', 'nadie aprueba']);
  });

  it('3 · sin break pide de más; «bloqueado» siempre sobra; cuatro intentos pide de más con tres fallos', () => {
    const sinBreak = REF[R3.id].replace('        break\n', '').replace('    print("Incorrecto.")\n    intentos = intentos - 1', '    else:\n        print("Incorrecto.")\n        intentos = intentos - 1');
    const v = juzgarPrograma(R3, enCelda('Reto 3', sinBreak));
    expect(v.casos.map((c) => c.clase)).toEqual(['pide-de-mas', 'pide-de-mas', 'pasa', 'pide-de-mas']);
    const siempre = py(
      'intentos = 3',
      'while intentos > 0:',
      '    c = int(input())',
      '    if c == 47:',
      '        print("¡Casillero abierto!")',
      '        break',
      '    print("Incorrecto.")',
      '    intentos = intentos - 1',
      'print("Casillero bloqueado.")',
    );
    expect(caidos(R3, siempre)).toEqual(['falla y luego acierta', 'a la primera', 'acierta en el último intento']);
    expect(juzgarPrograma(R3, enCelda('Reto 3', REF[R3.id].replace('intentos = 3', 'intentos = 4'))).casos[2].clase).toBe('pide-de-mas');
  });
});

describe('el manual dice la verdad sobre el motor', () => {
  it.each(Object.entries(MANUAL_RETOS))('%s', (_id, ficha) => {
    const m = ejecutar(ficha.programa.join('\n'), { entradas: ficha.tecleado });
    expect(m.estado).toBe('terminada');
    expect(m.salida).toEqual(ficha.consola);
  });

  it('ninguna ficha habla de precios, piezas, calificaciones, casilleros ni del 47', () => {
    for (const ficha of Object.values(MANUAL_RETOS)) {
      expect(ficha.programa.join('\n')).not.toMatch(/precio|pieza|calific|aprob|promedio|casillero|candado|47|pesos/i);
    }
  });
});

describe('ningún encargo dicta código', () => {
  it('ni for…in, ni range(, ni print, ni input, ni asignaciones en instrucciones o pistas', () => {
    for (const paso of CLASE.guion.pasos) {
      for (const t of [paso.instruccion, paso.pista]) {
        expect(t).not.toMatch(/for\s+\w+\s+in|range\s*\(|print\s*\(|input\s*\(|\w+\s*=\s*\w/);
      }
    }
  });
});
