/**
 * «Variables y tipos» sobre el juez de programas con `datos` (§69.19).
 *
 * El juez cambia la primera línea `nombre = …` de la celda por la de cada
 * caso. Las salidas se midieron con CPython (`scratchpad/n7/medir-tipos.py`)
 * y aquí se vuelven a medir con el intérprete; cada señuelo cae donde dijo
 * CPython y cada ficha del manual se ejecuta.
 */

import { ejecutar } from '@/components/simuladores/codigo/maquina';
import { juzgarPrograma, revisarProblemaPrograma, type ProblemaPrograma } from '@/components/simuladores/juez';
import { CELDAS_TIPOS, MANUAL_TIPOS, PROBLEMAS_TIPOS, T1, T2, T3 } from '@/components/activities/python/problemasTipos';
import { CLASE, PLANTILLA } from '@/components/activities/python/LabVariablesYTipos';
import { recortarCelda } from '@/components/simuladores/codigo/celdas';

/** Mete el programa debajo de las líneas de datos de la celda. */
function enCelda(celda: string, programa: string, base = PLANTILLA): string {
  const lineas = base.split('\n');
  const i = lineas.findIndex((l) => l.startsWith(`# %% ${celda}`));
  if (i === -1) throw new Error(`no hay celda ${celda}`);
  let j = i + 1;
  while (j < lineas.length && /^\w+\s*=/.test(lineas[j])) j++;
  lineas.splice(j, 0, ...programa.split('\n'));
  return lineas.join('\n');
}

const REF: Record<string, string> = {
  [T1.id]: 'print("Credencial: " + nombre + ", " + str(edad) + " años")',
  [T2.id]: 'print("Cada equipo:", pizzas / equipos, "pizzas")\nprint("Enteras por equipo:", pizzas // equipos)',
  [T3.id]: 'print("Puntos con bono:", int(puntos) + bono)',
};

function caidos(p: ProblemaPrograma, programa: string, base = PLANTILLA): string[] {
  return juzgarPrograma(p, enCelda(p.celda as string, programa, base))
    .casos.filter((c) => c.clase !== 'pasa')
    .map((c) => c.nombre);
}

describe('los problemas están bien escritos y la plantilla trae sus celdas y sus datos', () => {
  it.each(PROBLEMAS_TIPOS.map((p) => [p.id, p] as const))('%s', (_id, p) => {
    expect(revisarProblemaPrograma(p)).toEqual([]);
    const celda = recortarCelda(PLANTILLA, p.celda as string) as string;
    for (const d of p.datos ?? []) expect(celda).toMatch(new RegExp(`^${d} = `, 'm'));
  });

  it('cada encargo con celda la encuentra en la plantilla', () => {
    for (const celda of Object.values(CELDAS_TIPOS)) expect(recortarCelda(PLANTILLA, celda)).not.toBeNull();
  });

  it('un problema con datos sin valor en algún caso es una queja', () => {
    const roto: ProblemaPrograma = { ...T1, casos: T1.casos.map((c, i) => (i === 1 ? { ...c, datos: { nombre: '"X"' } } : c)) };
    expect(revisarProblemaPrograma(roto).join(' ')).toContain('un valor para cada dato');
  });
});

describe('las referencias se aceptan con el intérprete', () => {
  it.each(PROBLEMAS_TIPOS.map((p) => [p.id, p] as const))('%s', (id, p) => {
    expect(caidos(p, REF[id])).toEqual([]);
  });

  it('otras formas valen: las comas bien puestas y int() de la división', () => {
    expect(caidos(T1, 'print("Credencial:", nombre + ",", edad, "años")')).toEqual([]);
    expect(caidos(T2, 'print("Cada equipo:", pizzas / equipos, "pizzas")\nprint("Enteras por equipo:", int(pizzas / equipos))')).toEqual([]);
  });

  it('el juez cambia el dato aunque el alumno haya cambiado el del ejemplo', () => {
    const base = PLANTILLA.replace('edad = 13', 'edad = 99');
    expect(caidos(T1, REF[T1.id], base)).toEqual([]);
  });
});

describe('los señuelos caen donde dijo CPython (tabla de §69.19)', () => {
  it('1 · escrito a mano pasa el ejemplo y cae en los tres ocultos', () => {
    expect(caidos(T1, 'print("Credencial: Ana, 13 años")')).toEqual(['un nombre con espacio', 'alguien de 9', 'la socia más grande']);
  });

  it('1 · sin str revienta con error de tipo; las comas sueltas meten un espacio', () => {
    const v = juzgarPrograma(T1, enCelda('Problema 1', 'print("Credencial: " + nombre + ", " + edad + " años")'));
    expect(v.casos.every((c) => c.clase === 'error')).toBe(true);
    expect(caidos(T1, 'print("Credencial:", nombre, ",", edad, "años")')).toHaveLength(4);
  });

  it('2 · // en las dos y / en las dos caen en todos', () => {
    expect(caidos(T2, 'print("Cada equipo:", pizzas // equipos, "pizzas")\nprint("Enteras por equipo:", pizzas // equipos)')).toHaveLength(4);
    expect(caidos(T2, 'print("Cada equipo:", pizzas / equipos, "pizzas")\nprint("Enteras por equipo:", pizzas / equipos)')).toHaveLength(4);
  });

  it('3 · pegar da 73, sin convertir revienta, float da 10.0', () => {
    const pegar = juzgarPrograma(T3, enCelda('Problema 3', 'print("Puntos con bono:", puntos + str(bono))'));
    expect(pegar.casos[0].obtenida).toEqual(['Puntos con bono: 73']);
    expect(juzgarPrograma(T3, enCelda('Problema 3', 'print("Puntos con bono:", puntos + bono)')).casos[0].clase).toBe('error');
    expect(caidos(T3, 'print("Puntos con bono:", float(puntos) + bono)')).toHaveLength(4);
  });

  it('borrar la línea del dato da un error que dice cuál falta y que no se borre', () => {
    const sinEdad = enCelda('Problema 1', REF[T1.id]).replace('edad = 13\n', '');
    const v = juzgarPrograma(T1, sinEdad);
    expect(v.casos[0].clase).toBe('error');
    expect(v.casos[0].explicacion).toContain('«edad = …»');
  });

  it('el número de línea de un error sigue siendo el del alumno', () => {
    const texto = enCelda('Problema 3', 'print("Puntos con bono:", puntos + bono)');
    const linea = texto.split('\n').findIndex((l) => l.startsWith('print("Puntos')) + 1;
    expect(juzgarPrograma(T3, texto).casos[1].linea).toBe(linea);
  });
});

describe('las exploraciones juzgan la meta, no la línea', () => {
  const comprueba = (id: string, fuente: string) => {
    const paso = CLASE.guion.pasos.find((p) => p.id === id);
    if (paso?.logro.tipo !== 'ejecucion') throw new Error('no es de ejecución');
    const m = ejecutar(fuente, {});
    const variables = [...m.globales.entries()].map(([nombre, valor]) => ({ nombre, valor, ambito: 'global', texto: '' }));
    const e = { fase: m.estado, error: m.error, salida: m.salida, variables } as unknown as Parameters<typeof paso.logro.comprueba>[0];
    return paso.logro.comprueba(e, fuente);
  };

  it('cuatro cajas: con cualquier nombre, pero hacen falta los cuatro tipos', () => {
    expect(comprueba('cuatro-cajas', 'a = 1\nb = 2.5\nc = "hola"\nd = False')).toBe(true);
    expect(comprueba('cuatro-cajas', 'a = 1\nb = 2.5\nc = "hola"')).toBe(false);
    expect(comprueba('cuatro-cajas', 'a = 1\nb = 2\nc = "True"\nd = "1.5"')).toBe(false);
  });

  it('pregúntale: hace falta lo que contesta type(), no un texto cualquiera', () => {
    expect(comprueba('preguntale', 'x = 3\nprint(type(x))')).toBe(true);
    expect(comprueba('preguntale', 'print("int")')).toBe(false);
  });

  it('mezcla y no-se-deja: cada una con su familia de error', () => {
    expect(comprueba('mezcla-a-proposito', 'print("a" + 3)')).toBe(true);
    expect(comprueba('mezcla-a-proposito', 'print(int("x"))')).toBe(false);
    expect(comprueba('no-se-deja', 'print(int("trece"))')).toBe(true);
    expect(comprueba('no-se-deja', 'print("a" + 3)')).toBe(false);
  });
});

describe('el manual dice la verdad sobre el motor', () => {
  it.each(Object.entries(MANUAL_TIPOS))('%s', (_id, ficha) => {
    const m = ejecutar(ficha.programa.join('\n'), { entradas: ficha.tecleado });
    expect(m.estado).toBe('terminada');
    expect(m.salida).toEqual(ficha.consola);
  });

  it('ninguna ficha habla de credenciales, pizzas ni marcadores', () => {
    for (const ficha of Object.values(MANUAL_TIPOS)) {
      expect(ficha.programa.join('\n')).not.toMatch(/credencial|pizza|equipos|puntos|bono|nombre|edad/i);
    }
  });
});

describe('ningún encargo dicta código', () => {
  it('ni print(, ni type(, ni str(, ni int(, ni asignaciones en instrucciones o pistas', () => {
    for (const paso of CLASE.guion.pasos) {
      for (const t of [paso.instruccion, paso.pista]) {
        expect(t).not.toMatch(/print\s*\(|type\s*\(\s*\w|str\s*\(\s*\w|int\s*\(\s*["\w]|\w+\s*=\s*["\w]/);
      }
    }
  });
});
