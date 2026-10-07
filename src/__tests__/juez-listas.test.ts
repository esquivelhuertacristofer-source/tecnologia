/**
 * «Listas y diccionarios» sobre el juez de programas con `datos` (§69.20).
 *
 * El juez cambia la lista o el diccionario de arriba de la celda en cada caso.
 * Las salidas se midieron con CPython (`scratchpad/n7/medir-listas.py`) y aquí
 * se vuelven a medir con el intérprete; cada señuelo cae donde dijo CPython y
 * cada ficha del manual se ejecuta.
 */

import { ejecutar } from '@/components/simuladores/codigo/maquina';
import { juzgarPrograma, revisarProblemaPrograma, type ProblemaPrograma } from '@/components/simuladores/juez';
import { CELDAS_LISTAS, L1, L2, L3, L4, L5, MANUAL_LISTAS, PROBLEMAS_LISTAS } from '@/components/activities/n8/python/problemasListas';
import { CLASE, PLANTILLA } from '@/components/activities/n8/python/LabListasYDiccionarios';
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
  [L1.id]: 'print("Primero:", mochila[0])\nprint("Último:", mochila[-1])\nprint("Cosas:", len(mochila))',
  [L2.id]: 'mochila.append(nuevo)\nprint(mochila)\nprint("Ahora son", len(mochila))',
  [L3.id]:
    't = 0\nm = precios[0]\nfor p in precios:\n    t = t + p\n    if p > m:\n        m = p\nprint("Total:", t, "pesos")\nprint("Más caro:", m)',
  [L4.id]:
    'if buscar in inventario:\n    print(buscar + ":", inventario[buscar], "en el almacén")\nelse:\n    print("No tenemos " + buscar + ".")',
  [L5.id]:
    'n = 0\nfor producto, cantidad in inventario.items():\n    if cantidad == 0:\n        print("Falta:", producto)\n        n = n + 1\nprint("Agotados:", n)',
};

function caidos(p: ProblemaPrograma, programa: string, base = PLANTILLA): string[] {
  return juzgarPrograma(p, enCelda(p.celda as string, programa, base))
    .casos.filter((c) => c.clase !== 'pasa')
    .map((c) => c.nombre);
}

function veredictos(p: ProblemaPrograma, programa: string) {
  return juzgarPrograma(p, enCelda(p.celda as string, programa)).casos;
}

describe('los problemas están bien escritos y la plantilla trae sus celdas y sus datos', () => {
  it.each(PROBLEMAS_LISTAS.map((p) => [p.id, p] as const))('%s', (_id, p) => {
    expect(revisarProblemaPrograma(p)).toEqual([]);
    const celda = recortarCelda(PLANTILLA, p.celda as string) as string;
    for (const d of p.datos ?? []) expect(celda).toMatch(new RegExp(`^${d} = `, 'm'));
  });

  it('cada encargo con celda la encuentra en la plantilla', () => {
    for (const celda of Object.values(CELDAS_LISTAS)) expect(recortarCelda(PLANTILLA, celda)).not.toBeNull();
  });

  it('el ejemplo de la plantilla es el del caso visible', () => {
    for (const p of PROBLEMAS_LISTAS) {
      const celda = recortarCelda(PLANTILLA, p.celda as string) as string;
      const visible = p.casos.find((c) => !c.oculto);
      for (const [nombre, valor] of Object.entries(visible?.datos ?? {})) expect(celda).toContain(`${nombre} = ${valor}`);
    }
  });
});

describe('las referencias se aceptan con el intérprete', () => {
  it.each(PROBLEMAS_LISTAS.map((p) => [p.id, p] as const))('%s', (id, p) => {
    expect(caidos(p, REF[id])).toEqual([]);
  });

  it('otras formas valen: sum y max, y recorrer el diccionario por clave', () => {
    expect(caidos(L3, 'print("Total:", sum(precios), "pesos")\nprint("Más caro:", max(precios))')).toEqual([]);
    expect(
      caidos(L5, 'n = 0\nfor producto in inventario:\n    if inventario[producto] == 0:\n        print("Falta:", producto)\n        n = n + 1\nprint("Agotados:", n)'),
    ).toEqual([]);
    expect(caidos(L1, 'print("Primero:", mochila[0])\nprint("Último:", mochila[len(mochila) - 1])\nprint("Cosas:", len(mochila))')).toEqual([]);
  });

  it('la lista se imprime como la escribe Python, con acentos y comillas simples', () => {
    expect(veredictos(L2, REF[L2.id])[0].obtenida).toEqual(["['cuaderno', 'lápiz', 'regla']", 'Ahora son 3']);
  });
});

describe('los señuelos caen donde dijo CPython (tabla de §69.20)', () => {
  it('1 · [2] por «último» pasa el ejemplo; [len] cae en todos; a mano, en los ocultos', () => {
    const dos = veredictos(L1, REF[L1.id].replace('mochila[-1]', 'mochila[2]'));
    expect(dos[0].clase).toBe('pasa');
    expect(dos[1].clase).toBe('error');
    expect(dos.slice(1).every((c) => c.clase !== 'pasa')).toBe(true);
    expect(veredictos(L1, REF[L1.id].replace('mochila[-1]', 'mochila[len(mochila)]')).every((c) => c.clase === 'error')).toBe(true);
    expect(caidos(L1, 'print("Primero: cuaderno")\nprint("Último: regla")\nprint("Cosas: 3")')).toEqual(['una sola cosa', 'cinco cosas', 'dos cosas']);
  });

  it('2 · imprimir antes de agregar cae en todos; sumar la lista con un texto revienta', () => {
    expect(caidos(L2, 'print(mochila)\nmochila.append(nuevo)\nprint("Ahora son", len(mochila))')).toHaveLength(3);
    expect(veredictos(L2, 'mochila = mochila + nuevo\nprint(mochila)').every((c) => c.clase === 'error')).toBe(true);
  });

  it('3 · «el último es el más caro» cae en el ejemplo y en el de mayor a menor', () => {
    expect(caidos(L3, 'print("Total:", sum(precios), "pesos")\nprint("Más caro:", precios[-1])')).toEqual(['tres precios', 'de mayor a menor']);
  });

  it('4 · leer sin preguntar revienta en compás; preguntar «¿hay piezas?» cae sólo en la goma', () => {
    const directo = veredictos(L4, 'print(buscar + ":", inventario[buscar], "en el almacén")');
    expect(directo[1].clase).toBe('error');
    const porVerdad =
      'if buscar in inventario and inventario[buscar]:\n    print(buscar + ":", inventario[buscar], "en el almacén")\nelse:\n    print("No tenemos " + buscar + ".")';
    expect(caidos(L4, porVerdad)).toEqual(['está pero en cero']);
    const get = 'if inventario.get(buscar):\n    print(buscar + ":", inventario[buscar], "en el almacén")\nelse:\n    print("No tenemos " + buscar + ".")';
    expect(caidos(L4, get)).toEqual(['está pero en cero']);
  });

  it('5 · contar todos los productos cae en el ejemplo', () => {
    const sinContar = 'for producto, cantidad in inventario.items():\n    if cantidad == 0:\n        print("Falta:", producto)\nprint("Agotados:", len(inventario))';
    expect(caidos(L5, sinContar)).toContain('uno agotado');
  });

  it('el juez cambia la lista aunque el alumno haya cambiado la del ejemplo', () => {
    const base = PLANTILLA.replace('precios = [12, 30, 22]', 'precios = [1]');
    expect(caidos(L3, REF[L3.id], base)).toEqual([]);
  });
});

describe('la exploración juzga la meta, no la línea', () => {
  const comprueba = (id: string, fuente: string) => {
    const paso = CLASE.guion.pasos.find((p) => p.id === id);
    if (paso?.logro.tipo !== 'ejecucion') throw new Error('no es de ejecución');
    const m = ejecutar(fuente, {});
    const e = { fase: m.estado, error: m.error, salida: m.salida, variables: [] } as unknown as Parameters<typeof paso.logro.comprueba>[0];
    return paso.logro.comprueba(e, fuente);
  };

  it('cualquier casilla que no exista vale; otro error no', () => {
    expect(comprueba('la-casilla-que-no-existe', 'mochila = ["a", "b", "c"]\nprint(mochila[3])')).toBe(true);
    expect(comprueba('la-casilla-que-no-existe', 'mochila = ["a", "b", "c"]\nprint(mochila[-4])')).toBe(true);
    expect(comprueba('la-casilla-que-no-existe', 'mochila = ["a", "b", "c"]\nprint(mochila[2])')).toBe(false);
    expect(comprueba('la-casilla-que-no-existe', 'print(mochila[0])')).toBe(false);
  });
});

describe('el manual dice la verdad sobre el motor', () => {
  it.each(Object.entries(MANUAL_LISTAS))('%s', (_id, ficha) => {
    const m = ejecutar(ficha.programa.join('\n'), { entradas: ficha.tecleado });
    expect(m.estado).toBe('terminada');
    expect(m.salida).toEqual(ficha.consola);
  });

  it('ninguna ficha habla de mochilas, precios ni inventarios', () => {
    for (const ficha of Object.values(MANUAL_LISTAS)) {
      expect(ficha.programa.join('\n')).not.toMatch(/mochila|precio|inventario|buscar|nuevo|almac|agotad|falta/i);
    }
  });
});

describe('ningún encargo dicta código', () => {
  it('ni print(, ni append(, ni corchetes con índice, ni asignaciones en instrucciones o pistas', () => {
    for (const paso of CLASE.guion.pasos) {
      for (const t of [paso.instruccion, paso.pista]) {
        expect(t).not.toMatch(/print\s*\(|append\s*\(|len\s*\(|\w\[\s*-?\w+\s*\]|\w+\s*=\s*["\w[{]|\.items\s*\(/);
      }
    }
  });

  it('ni las pistas de los problemas', () => {
    for (const p of PROBLEMAS_LISTAS) {
      for (const t of p.pistas) expect(t).not.toMatch(/print\s*\(|append\s*\(|\w\[\s*-?\w+\s*\]|\w+\s*=\s*["\w[{]|\.items\s*\(/);
    }
  });
});
