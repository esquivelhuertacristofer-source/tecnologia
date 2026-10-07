/**
 * M4 (§69.21) — módulos, archivos y librerías en el motor de Tecnia Código.
 *
 * La primera tabla no lleva ni una salida escrita a mano: `medido-m4.ts` lo
 * genera `scratchpad/n7/generar-m4.py` corriendo cada programa en CPython 3.14
 * con sus archivos en un disco de verdad. Lo de abajo es lo que CPython no
 * puede medir: de qué archivo es un error, las frases, el panel, el paso a paso.
 */

import {
  archivoActual,
  crearMaquina,
  ejecutar,
  pasoDeLinea,
  variables,
  type Maquina,
} from '@/components/simuladores/codigo/maquina';
import { textoDeError } from '@/components/simuladores/codigo/errores';
import { MEDIDO_EN_CPYTHON } from './medido-m4';

describe('M4 contra CPython (tabla generada)', () => {
  it.each(MEDIDO_EN_CPYTHON.map((f) => [f.nombre, f] as const))('%s', (_n, f) => {
    const m = ejecutar(f.programa, { archivos: f.archivos, archivo: 'principal.py' });
    expect(m.salida).toEqual(f.salida);
    if (f.familia) {
      expect(m.estado).toBe('error');
      expect(m.error?.familia).toBe(f.familia);
    } else {
      expect(m.error).toBeNull();
      expect(m.estado).toBe('terminada');
    }
  });
});

const CLIMA = 'UMBRAL = 15\n\ndef frio(t):\n    return t < UMBRAL\n\nif __name__ == "__main__":\n    print("probando", frio(3))\n';

describe('de qué archivo es cada cosa', () => {
  it('un error dentro de un módulo dice su archivo y su línea, no la del que se corre', () => {
    const m = ejecutar('import roto\nprint("antes")\nroto.f(1)', { archivos: { 'roto.py': 'def f(x):\n    return x / 0\n' } });
    expect(m.error?.archivo).toBe('roto.py');
    expect(m.error?.linea).toBe(2);
    expect(textoDeError(m.error!)).toMatch(/^roto\.py · Línea 2 · /);
  });

  it('un error del archivo que se corre no lleva archivo', () => {
    const m = ejecutar('import roto\nx = 1 / 0', { archivos: { 'roto.py': 'y = 2\n' } });
    expect(m.error?.linea).toBe(2);
    expect(m.error?.archivo).toBeNull();
  });

  it('un módulo mal escrito da su error de sintaxis con su archivo', () => {
    const m = ejecutar('print("antes")\nimport roto', { archivos: { 'roto.py': 'def f(x)\n    return x\n' } });
    expect(m.salida).toEqual(['antes']);
    expect(m.error?.clase).toBe('sintaxis');
    expect(m.error?.archivo).toBe('roto.py');
    expect(m.error?.linea).toBe(1);
  });

  it('un return fuera de función en un módulo también dice el archivo', () => {
    const m = ejecutar('import roto', { archivos: { 'roto.py': 'x = 1\nreturn x\n' } });
    expect(m.error?.archivo).toBe('roto.py');
  });

  it('el paso a paso entra en el módulo y la máquina dice que va por él', () => {
    const a = crearMaquina('import clima\nprint(clima.frio(20))', { archivos: { 'clima.py': CLIMA } });
    if (!a.ok) throw new Error('no arrancó');
    const m: Maquina = a.maq;
    const vistos = new Set<string | null>();
    for (let i = 0; i < 40 && m.estado !== 'terminada'; i += 1) {
      pasoDeLinea(m);
      vistos.add(archivoActual(m));
    }
    expect(vistos.has('clima.py')).toBe(true);
    expect(vistos.has(null)).toBe(true);
    expect(m.salida).toEqual(['False']);
  });
});

describe('las variables y los nombres', () => {
  it('__name__ no se cuela en el panel de variables', () => {
    const m = ejecutar('x = 1\nprint(__name__)');
    expect(m.salida).toEqual(['__main__']);
    expect(variables(m).map((v) => v.nombre)).toEqual(['x']);
  });

  it('dentro de una función del módulo se ven las variables del módulo', () => {
    const a = crearMaquina('import clima\nUMBRAL = 99\nclima.frio(3)', { archivos: { 'clima.py': CLIMA } });
    if (!a.ok) throw new Error('no arrancó');
    const m = a.maq;
    let visto: string[] = [];
    for (let i = 0; i < 60 && m.estado !== 'terminada'; i += 1) {
      pasoDeLinea(m);
      if (archivoActual(m) === 'clima.py' && m.marcos.some((x) => x.nombre === 'frio')) {
        visto = variables(m).map((v) => `${v.ambito}:${v.nombre}=${v.texto}`);
      }
    }
    expect(visto).toContain('global:UMBRAL=15');
    expect(visto).toContain('local:t=3');
  });

  it('las variables del programa se llaman igual que antes: m.globales', () => {
    const m = ejecutar('import math\nr = math.sqrt(9)');
    expect([...m.globales.keys()]).toEqual(['math', 'r']);
  });
});

describe('las frases de lo que no se puede', () => {
  const error = (programa: string, archivos: Record<string, string> = {}) =>
    ejecutar(programa, { archivos, archivo: 'estacion.py' }).error;

  it('import clima.py dice que va sin el .py', () => {
    const e = error('import clima.py', { 'clima.py': CLIMA });
    expect(e?.clase).toBe('sintaxis');
    expect(e?.mensaje).toContain('sin el «.py»');
    expect(e?.pista).toContain('import clima');
  });

  it('from x import * tiene su frase', () => {
    expect(error('from math import *')?.mensaje).toContain('«*»');
  });

  it('random no está, y la frase dice por qué', () => {
    const e = error('import random');
    expect(e?.clase).toBe('modulo');
    expect(e?.pista).toContain('no se puede comprobar');
  });

  it('un módulo mal escrito sugiere el parecido', () => {
    expect(error('import climaa', { 'clima.py': CLIMA })?.pista).toContain('«clima»');
  });

  it('el archivo que se corre no se importa a sí mismo', () => {
    expect(error('import estacion', { 'estacion.py': 'x = 1' })?.mensaje).toContain('no se importa a sí mismo');
  });

  it('dos módulos que se importan entre ellos', () => {
    const e = error('import a', { 'a.py': 'import b\n', 'b.py': 'import a\n' });
    expect(e?.clase).toBe('importacion');
    expect(e?.archivo).toBe('b.py');
  });

  it('el archivo que no existe sugiere el parecido o lista los que hay', () => {
    expect(error('open("lectura.csv")', { 'lecturas.csv': 'x' })?.pista).toContain('«lecturas.csv»');
    expect(error('open("otro.txt")', { 'lecturas.csv': 'x' })?.pista).toContain('lecturas.csv');
    expect(error('open("otro.txt")')?.pista).toContain('no trae archivos');
  });

  it('with sólo abre archivos', () => {
    expect(error('with 5 as f:\n    pass')?.mensaje).toContain('sólo sirve para abrir archivos');
  });

  it('un método sin paréntesis sigue diciendo que le faltan', () => {
    expect(error('x = "hola".upper')?.mensaje).toContain('«upper» tiene que llamarse con paréntesis');
  });

  it('a lo de un módulo no se le asigna', () => {
    expect(error('import math\nmath.pi = 3')?.mensaje).toContain('módulo');
  });

  it('as suelto', () => {
    expect(error('x = 3\nas')?.mensaje).toContain('«as»');
  });
});

describe('el disco', () => {
  it('lo escrito queda en m.disco y en m.escritos, y no toca los archivos que se le dieron', () => {
    const archivos = { 'datos.csv': 'a\n' };
    const m = ejecutar('with open("datos.csv", "w") as f:\n    f.write("pisado")\nwith open("r.txt", "w") as g:\n    g.write("x")', { archivos });
    expect(archivos['datos.csv']).toBe('a\n');
    expect(m.disco.get('datos.csv')).toBe('pisado');
    expect(m.escritos).toEqual(['datos.csv', 'r.txt']);
  });

  it('un write sin fin en un bucle para con el tope', () => {
    const m = ejecutar('f = open("x.txt", "w")\nwhile True:\n    f.write("aaaaaaaaaa")', { topes: { TAMANO: 1000 } });
    expect(m.error?.clase).toBe('limite');
  });
});
