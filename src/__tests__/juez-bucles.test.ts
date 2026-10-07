/**
 * Los cuatro problemas de «Bucles» sobre el juez de programas (§69.17).
 *
 * Igual que `juez-condicionales.test.ts`: las salidas literales vuelven a
 * medirse con el intérprete (se midieron primero con CPython,
 * `scratchpad/n7/medir-bucles.py`), cada señuelo de la tabla de §69.17 cae
 * donde CPython dijo, y cada ficha del manual se ejecuta.
 */

import { ejecutar } from '@/components/simuladores/codigo/maquina';
import { juzgarPrograma, revisarProblemaPrograma, type ProblemaPrograma } from '@/components/simuladores/juez';
import { B1, B2, B3, B4, CELDAS_BUCLES, MANUAL_BUCLES, PROBLEMAS_BUCLES } from '@/components/activities/python/problemasBucles';
import { CLASE, PLANTILLA } from '@/components/activities/python/LabBucles';
import { recortarCelda } from '@/components/simuladores/codigo/celdas';

const py = (...l: string[]) => l.join('\n');

function enCelda(celda: string, programa: string, base = PLANTILLA): string {
  const lineas = base.split('\n');
  const i = lineas.findIndex((l) => l.startsWith(`# %% ${celda}`));
  if (i === -1) throw new Error(`no hay celda ${celda}`);
  lineas.splice(i + 1, 0, ...programa.split('\n'));
  return lineas.join('\n');
}

export const REF: Record<string, string> = {
  [B1.id]: py('n = int(input("¿Cuántas vueltas? "))', 'for i in range(1, n + 1):', '    print("Vuelta", i)', 'print("¡Terminaste!")'),
  [B2.id]: py('d = int(input())', 't = 0', 'for i in range(d):', '    k = int(input())', '    t = t + k', 'print("Total:", t, "km")'),
  [B3.id]: py(
    'meta = int(input())',
    't = 0',
    's = 0',
    'while t < meta:',
    '    t = t + int(input())',
    '    s = s + 1',
    'print("Salidas para llegar:", s)',
  ),
  [B4.id]: py(
    'n = 0',
    't = 0',
    'while True:',
    '    m = int(input())',
    '    if m == 0:',
    '        break',
    '    n = n + 1',
    '    t = t + m',
    'print(n, "monedas,", t, "pesos")',
  ),
};

/** Qué casos fallan, por nombre. */
function caidos(p: ProblemaPrograma, programa: string): string[] {
  return juzgarPrograma(p, enCelda(p.celda as string, programa))
    .casos.filter((c) => c.clase !== 'pasa')
    .map((c) => c.nombre);
}

function clases(p: ProblemaPrograma, programa: string): string[] {
  return juzgarPrograma(p, enCelda(p.celda as string, programa)).casos.map((c) => c.clase);
}

describe('los problemas están bien escritos y la plantilla trae sus celdas', () => {
  it.each(PROBLEMAS_BUCLES.map((p) => [p.id, p] as const))('%s', (_id, p) => {
    expect(revisarProblemaPrograma(p)).toEqual([]);
    expect(recortarCelda(PLANTILLA, p.celda as string)).not.toBeNull();
  });

  it('cada encargo con celda la encuentra en la plantilla', () => {
    for (const celda of Object.values(CELDAS_BUCLES)) expect(recortarCelda(PLANTILLA, celda)).not.toBeNull();
  });
});

describe('las referencias se aceptan con el intérprete', () => {
  it.each(PROBLEMAS_BUCLES.map((p) => [p.id, p] as const))('%s', (id, p) => {
    expect(caidos(p, REF[id])).toEqual([]);
  });

  it('las cuatro juntas, cada una en su celda', () => {
    let texto = PLANTILLA;
    for (const p of PROBLEMAS_BUCLES) texto = enCelda(p.celda as string, REF[p.id], texto);
    for (const p of PROBLEMAS_BUCLES) expect(juzgarPrograma(p, texto).aceptado).toBe(true);
  });

  it('otra estructura también vale: la alcancía con lectura previa y while m != 0', () => {
    const previa = py('n = 0', 't = 0', 'm = int(input())', 'while m != 0:', '    n = n + 1', '    t = t + m', '    m = int(input())', 'print(n, "monedas,", t, "pesos")');
    expect(caidos(B4, previa)).toEqual([]);
  });

  it('otra estructura también vale: las vueltas con while', () => {
    const conWhile = py('n = int(input())', 'i = 1', 'while i <= n:', '    print("Vuelta", i)', '    i = i + 1', 'print("¡Terminaste!")');
    expect(caidos(B1, conWhile)).toEqual([]);
  });
});

describe('los señuelos caen donde dijo CPython (tabla de §69.17)', () => {
  it('1 · range(n) y range(1, n) caen en el visible; el 3 fijo, en los ocultos; «¡Terminaste!» adentro, en el visible', () => {
    const v = (rango: string, dentro = false) =>
      py('n = int(input())', `for i in ${rango}:`, '    print("Vuelta", i)', dentro ? '    print("¡Terminaste!")' : 'print("¡Terminaste!")');
    expect(caidos(B1, v('range(n)'))).toEqual(['tres vueltas', 'una sola vuelta', 'doce vueltas']);
    expect(caidos(B1, v('range(1, n)'))).toEqual(['tres vueltas', 'una sola vuelta', 'doce vueltas']);
    expect(caidos(B1, v('range(1, 4)'))).toEqual(['una sola vuelta', 'día de descanso', 'doce vueltas']);
    expect(caidos(B1, v('range(1, n + 1)', true))).toEqual(['tres vueltas', 'día de descanso', 'doce vueltas']);
  });

  it('1 · cinco print a mano pasan el ejemplo y nada más', () => {
    const aMano = py('n = int(input())', 'print("Vuelta 1")', 'print("Vuelta 2")', 'print("Vuelta 3")', 'print("¡Terminaste!")');
    expect(caidos(B1, aMano)).toEqual(['una sola vuelta', 'día de descanso', 'doce vueltas']);
  });

  it('2 · la suma dentro del bucle, el print dentro, tres días fijos y sin int', () => {
    const base = (cuerpo: string[], fuera = 'print("Total:", t, "km")') => py('d = int(input())', ...cuerpo, fuera);
    expect(caidos(B2, base(['for i in range(d):', '    t = 0', '    t = t + int(input())']))).toEqual([
      'tres días',
      'una semana sin entrenar',
      'cinco días, uno en cero',
    ]);
    expect(caidos(B2, base(['t = 0', 'for i in range(d):', '    t = t + int(input())', '    print("Total:", t, "km")'], ''))).toEqual([
      'tres días',
      'una semana sin entrenar',
      'cinco días, uno en cero',
    ]);
    expect(clases(B2, base(['t = 0', 'for i in range(3):', '    t = t + int(input())']))).toEqual(['pasa', 'pide-de-mas', 'pide-de-mas', 'falla']);
    expect(clases(B2, base(['t = 0', 'for i in range(d):', '    t = t + input()']))[0]).toBe('error');
  });

  it('3 · «menor o igual» pasa el ejemplo y pide un dato de más en los tres ocultos (la pregunta de cierre)', () => {
    const menorOIgual = REF[B3.id].replace('while t < meta:', 'while t <= meta:');
    expect(clases(B3, menorOIgual)).toEqual(['pasa', 'pide-de-mas', 'pide-de-mas', 'pide-de-mas']);
    const cierre = CLASE.guion.pasos.find((p) => p.id === 'el-que-pide-de-mas');
    expect(cierre?.logro).toMatchObject({ tipo: 'eleccion', correcta: 0 });
  });

  it('3 · el contador que empieza en 1 cae en todos; no sumar pide de más', () => {
    expect(caidos(B3, REF[B3.id].replace('s = 0', 's = 1'))).toHaveLength(4);
    const sinSumar = REF[B3.id].replace('    t = t + int(input())', '    k = int(input())');
    expect(clases(B3, sinSumar)).toEqual(['pide-de-mas', 'pide-de-mas', 'pide-de-mas', 'pide-de-mas']);
  });

  it('4 · contar el 0 como moneda cae en todos; tres monedas fijas dejan datos sin leer', () => {
    const cuentaElCero = py(
      'n = 0',
      't = 0',
      'while True:',
      '    m = int(input())',
      '    n = n + 1',
      '    t = t + m',
      '    if m == 0:',
      '        break',
      'print(n, "monedas,", t, "pesos")',
    );
    expect(caidos(B4, cuentaElCero)).toHaveLength(4);
    const tresFijas = py('n = 0', 't = 0', 'for i in range(3):', '    t = t + int(input())', '    n = n + 1', 'print(n, "monedas,", t, "pesos")');
    const v = juzgarPrograma(B4, enCelda('Problema 4', tresFijas));
    expect(v.casos[0].clase).toBe('falla');
    expect(v.casos[0].explicacion).toMatch(/leyó 3 datos y este caso trae 4/);
  });
});

describe('el manual dice la verdad sobre el motor', () => {
  it.each(Object.entries(MANUAL_BUCLES))('%s', (_id, ficha) => {
    const m = ejecutar(ficha.programa.join('\n'), { entradas: ficha.tecleado });
    expect(m.estado).toBe('terminada');
    expect(m.salida).toEqual(ficha.consola);
  });

  it('ninguna ficha habla de vueltas, kilómetros, metas ni monedas', () => {
    for (const ficha of Object.values(MANUAL_BUCLES)) {
      expect(ficha.programa.join('\n')).not.toMatch(/vuelta|km|kil[oó]metro|meta|moneda|alcanc|salida|pesos/i);
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

describe('el experimento del bucle que no para', () => {
  const paso = CLASE.guion.pasos.find((p) => p.id === 'el-bucle-que-no-para');
  const comprueba = (fuente: string) => {
    if (paso?.logro.tipo !== 'ejecucion') throw new Error('no es de ejecución');
    const m = ejecutar(fuente, {});
    const e = { fase: m.estado === 'error' ? 'error' : m.estado, error: m.error, salida: m.salida } as Parameters<typeof paso.logro.comprueba>[0];
    return paso.logro.comprueba(e, fuente);
  };

  it('un while que sí termina no lo cumple; uno que nunca cambia, sí', () => {
    expect(comprueba(MANUAL_BUCLES['el-bucle-que-no-para'].programa.join('\n'))).toBe(false);
    expect(comprueba(py('x = 3', 'while x > 0:', '    print(x)'))).toBe(true);
  });
});
