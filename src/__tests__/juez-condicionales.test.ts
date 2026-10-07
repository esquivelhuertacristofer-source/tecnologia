/**
 * Los cuatro problemas de «Condicionales» sobre el juez de programas (§68.5).
 *
 * Igual que `juez-programas.test.ts`: las salidas literales vuelven a medirse
 * con el intérprete (se midieron primero con CPython), cada señuelo de la tabla
 * de §68.5 cae donde CPython dijo, y cada ficha del manual se ejecuta.
 */

import { ejecutar } from '@/components/simuladores/codigo/maquina';
import { juzgarPrograma, revisarProblemaPrograma, type ProblemaPrograma } from '@/components/simuladores/juez';
import {
  C1,
  C2,
  C3,
  C4,
  CELDAS_CONDICIONALES,
  MANUAL_CONDICIONALES,
  PROBLEMAS_CONDICIONALES,
} from '@/components/activities/python/problemasCondicionales';
import { CLASE, PLANTILLA } from '@/components/activities/python/LabCondicionales';
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
  [C1.id]: py('a = int(input("Altura: "))', 'if a >= 120:', '    print("Puedes subir.")', 'else:', '    print("Todavía no.")'),
  [C2.id]: py(
    'a = int(input())',
    'if a < 120:',
    '    print("No puedes subir.")',
    'elif a < 150:',
    '    print("Subes con un adulto.")',
    'else:',
    '    print("Subes solo.")',
  ),
  [C3.id]: py(
    'a = int(input())',
    'b = input()',
    'if a < 120:',
    '    print("No puedes subir.")',
    'elif b == "vip":',
    '    print("Acceso VIP: subes ya.")',
    'else:',
    '    print("Fila normal.")',
  ),
  [C4.id]: py('e = int(input())', 'c = input()', 'if e < 5 or c == "si":', '    print("Entrada gratis.")', 'else:', '    print("Pagas entrada.")'),
};

/** Qué casos fallan, por nombre. */
function caidos(p: ProblemaPrograma, programa: string): string[] {
  return juzgarPrograma(p, enCelda(p.celda as string, programa))
    .casos.filter((c) => c.clase !== 'pasa')
    .map((c) => c.nombre);
}

describe('los problemas están bien escritos y la plantilla trae sus celdas', () => {
  it.each(PROBLEMAS_CONDICIONALES.map((p) => [p.id, p] as const))('%s', (_id, p) => {
    expect(revisarProblemaPrograma(p)).toEqual([]);
    expect(recortarCelda(PLANTILLA, p.celda as string)).not.toBeNull();
  });

  it('cada encargo con celda la encuentra en la plantilla', () => {
    for (const celda of Object.values(CELDAS_CONDICIONALES)) expect(recortarCelda(PLANTILLA, celda)).not.toBeNull();
  });
});

describe('las referencias se aceptan con el intérprete', () => {
  it.each(PROBLEMAS_CONDICIONALES.map((p) => [p.id, p] as const))('%s', (id, p) => {
    expect(caidos(p, REF[id])).toEqual([]);
  });

  it('las cuatro juntas, cada una en su celda', () => {
    let texto = PLANTILLA;
    for (const p of PROBLEMAS_CONDICIONALES) texto = enCelda(p.celda as string, REF[p.id], texto);
    for (const p of PROBLEMAS_CONDICIONALES) expect(juzgarPrograma(p, texto).aceptado).toBe(true);
  });

  it('otra estructura también vale: la cadena 120 <= a < 150, y el orden de mayor a menor', () => {
    const cadena = py(
      'a = int(input())',
      'if 120 <= a < 150:',
      '    print("Subes con un adulto.")',
      'elif a >= 150:',
      '    print("Subes solo.")',
      'else:',
      '    print("No puedes subir.")',
    );
    const deMayorAMenor = py(
      'a = int(input())',
      'if a >= 150:',
      '    print("Subes solo.")',
      'elif a >= 120:',
      '    print("Subes con un adulto.")',
      'else:',
      '    print("No puedes subir.")',
    );
    expect(caidos(C2, cadena)).toEqual([]);
    expect(caidos(C2, deMayorAMenor)).toEqual([]);
  });
});

describe('los señuelos caen donde dijo CPython (tabla de §68.5)', () => {
  it('1 · mayor que a secas cae justo en la marca', () => {
    expect(caidos(C1, py('a = int(input())', 'if a > 120:', '    print("Puedes subir.")', 'else:', '    print("Todavía no.")'))).toEqual([
      'justo en la marca',
    ]);
  });

  it('2 · el elif al revés pasa los ejemplos y cae sólo con alguien que no alcanza (la pregunta de cierre)', () => {
    const alReves = py(
      'a = int(input())',
      'if a < 150:',
      '    print("Subes con un adulto.")',
      'elif a < 120:',
      '    print("No puedes subir.")',
      'else:',
      '    print("Subes solo.")',
    );
    expect(caidos(C2, alReves)).toEqual(['alguien que no alcanza']);
    const cierre = CLASE.guion.pasos.find((p) => p.id === 'el-orden-importa');
    expect(cierre?.instruccion).toContain('alguien que no alcanza');
    expect(cierre?.logro).toMatchObject({ tipo: 'eleccion', correcta: 0 });
  });

  it('2 · las dos fronteras con menor o igual caen cada una en la suya', () => {
    const base = (m1: string, m2: string) =>
      py('a = int(input())', `if a ${m1}:`, '    print("No puedes subir.")', `elif a ${m2}:`, '    print("Subes con un adulto.")', 'else:', '    print("Subes solo.")');
    expect(caidos(C2, base('<= 120', '< 150'))).toEqual(['justo en la primera marca']);
    expect(caidos(C2, base('< 120', '<= 150'))).toEqual(['justo en la segunda marca']);
  });

  it('3 · preguntar el boleto antes que la altura, y el or, caen con el VIP que no alcanza; el and sin rama, en dos', () => {
    const vipPrimero = py(
      'a = int(input())',
      'b = input()',
      'if b == "vip":',
      '    print("Acceso VIP: subes ya.")',
      'elif a >= 120:',
      '    print("Fila normal.")',
      'else:',
      '    print("No puedes subir.")',
    );
    const soloAnd = py('a = int(input())', 'b = input()', 'if a >= 120 and b == "vip":', '    print("Acceso VIP: subes ya.")', 'else:', '    print("Fila normal.")');
    expect(caidos(C3, vipPrimero)).toEqual(['VIP que no alcanza']);
    expect(caidos(C3, soloAnd)).toEqual(['VIP que no alcanza', 'normal que no alcanza']);
  });

  it('4 · sólo el cumpleaños, el and y el menor o igual', () => {
    const cuerpo = (cond: string) => py('e = int(input())', 'c = input()', `if ${cond}:`, '    print("Entrada gratis.")', 'else:', '    print("Pagas entrada.")');
    expect(caidos(C4, cuerpo('c == "si"'))).toEqual(['pequeño sin cumpleaños']);
    expect(caidos(C4, cuerpo('e < 5 and c == "si"'))).toContain('adulto de cumpleaños');
    expect(caidos(C4, cuerpo('e <= 5 or c == "si"'))).toEqual(['justo en la edad límite']);
  });

  it('comparar con un solo = no llega a correr, y el editor dice qué signo esperaba', () => {
    const v = juzgarPrograma(C3, enCelda('Problema 3', py('a = int(input())', 'b = input()', 'if b = "vip":', '    print("Acceso VIP: subes ya.")')));
    expect(v.casos[0].clase).toBe('error');
    expect(v.casos[0].explicacion).toContain('«==»');
  });
});

describe('el manual dice la verdad sobre el motor', () => {
  it.each(Object.entries(MANUAL_CONDICIONALES))('%s', (_id, ficha) => {
    const m = ejecutar(ficha.programa.join('\n'), { entradas: ficha.tecleado });
    expect(m.estado).toBe('terminada');
    expect(m.salida).toEqual(ficha.consola);
  });

  it('ninguna ficha habla de alturas, boletos ni entradas', () => {
    for (const ficha of Object.values(MANUAL_CONDICIONALES)) {
      expect(ficha.programa.join('\n')).not.toMatch(/altura|vip|boleto|Serpiente|entrada|subir|120|150/i);
    }
  });
});

describe('ningún encargo dicta código', () => {
  it('ni if escritos, ni print, ni input en instrucciones o pistas', () => {
    for (const paso of CLASE.guion.pasos) {
      for (const t of [paso.instruccion, paso.pista]) {
        expect(t).not.toMatch(/\bif\s+\w+\s*[<>=!]|print\s*\(|input\s*\(|\w+\s*=\s*\d/);
      }
    }
  });
});
