/**
 * «Python intermedio» sobre el juez de programas con proyecto (M4, §69.21).
 *
 * El juez cambia `lecturas.csv` en cada caso, prueba `clima.py` por su cuenta
 * con un programa suyo y revisa `reporte.txt`. Las salidas se midieron con
 * CPython y archivos de verdad (`scratchpad/n7/medir-intermedio.py`); aquí se
 * vuelven a medir con el intérprete, y cada señuelo cae donde dijo CPython.
 */

import { ejecutar } from '@/components/simuladores/codigo/maquina';
import { recortarCelda } from '@/components/simuladores/codigo/celdas';
import { juzgarPrograma, revisarProblemaPrograma, type ProblemaPrograma } from '@/components/simuladores/juez';
import {
  CELDAS_INTERMEDIO,
  CSV,
  MANUAL_INTERMEDIO,
  MODULO,
  P1,
  P2,
  P3,
  PROBLEMAS_INTERMEDIO,
  SEMANA,
} from '@/components/activities/n10/python-intermedio/problemasIntermedio';
import { CLASE, CLIMA, PLANTILLA, usaLaLibreria } from '@/components/activities/n10/python-intermedio/LabPythonIntermedio';

function enCelda(celda: string, programa: string): string {
  const lineas = PLANTILLA.split('\n');
  const i = lineas.findIndex((l) => l.startsWith(`# %% ${celda}`));
  if (i === -1) throw new Error(`no hay celda ${celda}`);
  lineas.splice(i + 1, 0, ...programa.split('\n'));
  return lineas.join('\n');
}

const CLASIFICA = 'def clasifica(t):\n    if t < UMBRAL_FRIO:\n        return "frío"\n    if t <= UMBRAL_CALOR:\n        return "templado"\n    return "calor"\n';
const CLIMA_BIEN = CLIMA.replace('# ↓ aquí va la función clasifica\n', `# ↓ aquí va la función clasifica\n${CLASIFICA}`);
const proyecto = (clima = CLIMA_BIEN) => ({ [MODULO]: clima, [CSV]: SEMANA });

const REF: Record<string, string> = {
  [P1.id]: [
    'dias = []',
    'maximas = []',
    'with open("lecturas.csv") as f:',
    '    f.readline()',
    '    for linea in f:',
    '        partes = linea.strip().split(",")',
    '        dias.append(partes[0])',
    '        maximas.append(float(partes[1]))',
    'mejor = 0',
    'for i in range(len(maximas)):',
    '    if maximas[i] > maximas[mejor]:',
    '        mejor = i',
    'print("Días:", len(dias))',
    'print("Máxima promedio:", round(sum(maximas) / len(maximas), 1))',
    'print("Día más caluroso:", dias[mejor], "(" + str(maximas[mejor]) + ")")',
  ].join('\n'),
  [P2.id]: [
    'from clima import clasifica',
    'with open("lecturas.csv") as f:',
    '    f.readline()',
    '    for linea in f:',
    '        partes = linea.strip().split(",")',
    '        print(partes[0] + ":", clasifica(float(partes[1])))',
  ].join('\n'),
  [P3.id]: [
    'from clima import clasifica',
    'f = open("lecturas.csv")',
    'lineas = f.readlines()[1:]',
    'f.close()',
    'r = open("reporte.txt", "w")',
    'for linea in lineas:',
    '    partes = linea.strip().split(",")',
    '    t = float(partes[1])',
    '    r.write(partes[0] + " " + str(t) + " " + clasifica(t) + "\\n")',
    'r.close()',
    'print("Días en el reporte:", len(lineas))',
  ].join('\n'),
};

function veredicto(p: ProblemaPrograma, programa: string, clima = CLIMA_BIEN) {
  return juzgarPrograma(p, enCelda(p.celda as string, programa), proyecto(clima));
}
function caidos(p: ProblemaPrograma, programa: string, clima = CLIMA_BIEN): string[] {
  return veredicto(p, programa, clima)
    .casos.filter((c) => c.clase !== 'pasa')
    .map((c) => c.nombre);
}

describe('los problemas están bien escritos y el proyecto trae lo suyo', () => {
  it.each(PROBLEMAS_INTERMEDIO.map((p) => [p.id, p] as const))('%s', (_id, p) => {
    expect(revisarProblemaPrograma(p)).toEqual([]);
    expect(recortarCelda(PLANTILLA, p.celda as string)).not.toBeNull();
  });

  it('cada encargo con celda la encuentra en la plantilla', () => {
    for (const celda of Object.values(CELDAS_INTERMEDIO)) expect(recortarCelda(PLANTILLA, celda)).not.toBeNull();
  });

  it('el CSV del proyecto es el del caso visible', () => {
    for (const p of PROBLEMAS_INTERMEDIO) expect(p.casos.find((c) => !c.oculto)?.archivos?.[CSV]).toBe(SEMANA);
  });

  it('un caso con programa del juez que se viera sería una queja', () => {
    const roto: ProblemaPrograma = { ...P2, casos: P2.casos.map((c) => (c.principal ? { ...c, oculto: false } : c)) };
    expect(revisarProblemaPrograma(roto).join(' ')).toContain('código de la prueba');
  });

  it('el clima.py de la plantilla corre su prueba sólo cuando ya tiene clasifica', () => {
    expect(ejecutar(CLIMA, { archivo: MODULO }).error?.clase).toBe('nombre');
    expect(ejecutar(CLIMA_BIEN, { archivo: MODULO }).salida).toEqual(['Probando clima.py: templado']);
  });
});

describe('las referencias se aceptan con el intérprete', () => {
  it.each(PROBLEMAS_INTERMEDIO.map((p) => [p.id, p] as const))('%s', (id, p) => {
    expect(caidos(p, REF[id])).toEqual([]);
  });

  it('otras formas valen: statistics.mean, import clima con punto, readlines', () => {
    const conStats = 'import statistics\n' + REF[P1.id].replace('round(sum(maximas) / len(maximas), 1)', 'round(statistics.mean(maximas), 1)');
    expect(caidos(P1, conStats)).toEqual([]);
    const conPunto = REF[P2.id].replace('from clima import clasifica', 'import clima').replace('clasifica(float', 'clima.clasifica(float');
    expect(caidos(P2, conPunto)).toEqual([]);
  });

  it('la regla puede escribirse con elif o comparando con los números', () => {
    const otra = 'def clasifica(t):\n    if t > 25:\n        return "calor"\n    elif t >= 15:\n        return "templado"\n    else:\n        return "frío"\n';
    expect(caidos(P2, REF[P2.id], CLIMA.replace('# ↓ aquí va la función clasifica\n', otra))).toEqual([]);
  });
});

describe('los señuelos caen donde dijo CPython (tabla de §69.21)', () => {
  it('1 · no saltarse el encabezado revienta al convertir «maxima»', () => {
    const v = veredicto(P1, REF[P1.id].replace('    f.readline()\n', ''));
    expect(v.casos.every((c) => c.clase === 'error')).toBe(true);
    expect(v.casos[0].explicacion).toContain('maxima');
  });

  it('1 · comparar las máximas como textos cae sólo en el invierno', () => {
    const textos = REF[P1.id]
      .replace('maximas.append(float(partes[1]))', 'maximas.append(partes[1])')
      .replace('round(sum(maximas) / len(maximas), 1)', '24.6')
      .replace('str(maximas[mejor])', 'maximas[mejor]');
    expect(caidos(P1, textos)).toEqual(expect.arrayContaining(['una semana de invierno']));
    expect(veredicto(P1, textos).casos[0].clase).toBe('pasa');
  });

  it('1 · contar el encabezado dice un día de más en todos; >= hace ganar al último del empate', () => {
    const conEncabezado = REF[P1.id]
      .replace('    f.readline()\n', '    print_ = 0\n')
      .replace('        partes = linea.strip().split(",")\n        dias.append(partes[0])\n        maximas.append(float(partes[1]))', '        partes = linea.strip().split(",")\n        dias.append(partes[0])\n        if partes[0] != "dia":\n            maximas.append(float(partes[1]))')
      .replace('dias[mejor]', 'dias[mejor + 1]');
    expect(caidos(P1, conEncabezado)).toHaveLength(5);
    expect(caidos(P1, REF[P1.id].replace('maximas[i] > maximas[mejor]', 'maximas[i] >= maximas[mejor]'))).toEqual(['dos días empatan']);
  });

  it('1 · el promedio sin redondear cae en el ejemplo', () => {
    expect(caidos(P1, REF[P1.id].replace('round(sum(maximas) / len(maximas), 1)', 'sum(maximas) / len(maximas)'))).toContain('la semana del ejemplo');
  });

  it('2 · < donde iba <= cae en las fronteras, en el sin salto y en la prueba del juez', () => {
    const menor = CLIMA_BIEN.replace('t <= UMBRAL_CALOR', 't < UMBRAL_CALOR');
    expect(caidos(P2, REF[P2.id], menor)).toEqual(['días justo en las fronteras', 'sin salto al final', 'el juez prueba tu módulo solo']);
  });

  it('2 · la regla copiada en el principal pasa los datos y la prueba del juez la tumba', () => {
    const enElPrincipal = [
      'with open("lecturas.csv") as f:',
      '    f.readline()',
      '    for linea in f:',
      '        partes = linea.strip().split(",")',
      '        t = float(partes[1])',
      '        if t < 15:',
      '            c = "frío"',
      '        elif t <= 25:',
      '            c = "templado"',
      '        else:',
      '            c = "calor"',
      '        print(partes[0] + ":", c)',
    ].join('\n');
    const v = veredicto(P2, enElPrincipal, CLIMA);
    expect(v.casos.filter((c) => c.clase !== 'pasa').map((c) => c.nombre)).toEqual(['el juez prueba tu módulo solo']);
    const juez = v.casos[v.casos.length - 1];
    expect(juez.explicacion).toContain('el juez importó tu módulo');
    expect(juez.explicacion).toContain('clasifica');
    /* El programa del juez no se señala como línea del alumno. */
    expect(juez.linea).toBeUndefined();
  });

  it('2 · la prueba sin su if __name__ ensucia la salida de quien importa', () => {
    const sinGuarda = CLIMA_BIEN.replace('if __name__ == "__main__":\n    ', '');
    expect(caidos(P2, REF[P2.id], sinGuarda)).toHaveLength(5);
  });

  it('2 · un error dentro de clima.py dice el archivo y no manda a una línea de estacion.py', () => {
    const roto = CLIMA_BIEN.replace('return "calor"', 'return calr');
    const c = veredicto(P2, REF[P2.id], roto).casos[0];
    expect(c.clase).toBe('error');
    expect(c.explicacion).toMatch(/^clima\.py, línea \d+: /);
    expect(c.linea).toBeUndefined();
  });

  it('3 · sin salto queda todo en un renglón; abrir dentro del for deja sólo el último día', () => {
    const sinSalto = veredicto(P3, REF[P3.id].replace(' + "\\n"', ''));
    expect(sinSalto.casos[0].clase).toBe('falla');
    expect(sinSalto.casos[0].explicacion).toContain('un solo renglón');
    const dentro = REF[P3.id]
      .replace('r = open("reporte.txt", "w")\nfor linea in lineas:\n', 'for linea in lineas:\n    r = open("reporte.txt", "w")\n')
      .replace('r.close()\n', '');
    const v = veredicto(P3, dentro);
    expect(v.casos[0].clase).toBe('falla');
    /* Con un solo día abrirlo en cada vuelta da lo mismo: por eso el visible es la semana. */
    expect(v.casos.find((c) => c.nombre === 'un solo día')?.clase).toBe('pasa');
  });

  it('3 · no escribir el archivo es una falla que lo dice', () => {
    const v = veredicto(P3, 'print("Días en el reporte:", 7)');
    expect(v.casos[0].explicacion).toContain('no escribió «reporte.txt»');
  });

  it('el juez cambia el CSV aunque el alumno haya cambiado el del proyecto', () => {
    const otro = { [MODULO]: CLIMA_BIEN, [CSV]: 'dia,maxima,minima\nx,1.0,0.0\n' };
    const v = juzgarPrograma(P1, enCelda('Problema 1', REF[P1.id]), otro);
    expect(v.aceptado).toBe(true);
  });
});

describe('las exploraciones juzgan la meta, no la línea', () => {
  it('la librería: hace falta importarla y usar las dos, de cualquier forma', () => {
    expect(usaLaLibreria(enCelda('La librería', 'import statistics\nn = [1, 2, 3, 4, 10]\nprint(statistics.median(n))\nprint(statistics.mean(n))'))).toBe(true);
    expect(usaLaLibreria(enCelda('La librería', 'from statistics import mean, median\nprint(median([1, 2]), mean([1, 2]))'))).toBe(true);
    expect(usaLaLibreria(enCelda('La librería', 'import statistics\nprint(statistics.median([1, 2]))'))).toBe(false);
    expect(usaLaLibreria(enCelda('La librería', 'print("median( mean(")'))).toBe(false);
  });

  it('el archivo que no existe y el módulo solo miran el error y quién corrió', () => {
    const paso = (id: string) => CLASE.guion.pasos.find((p) => p.id === id);
    const archivo = paso('el-archivo-que-no-existe');
    const modulo = paso('corre-el-modulo');
    if (archivo?.logro.tipo !== 'ejecucion' || modulo?.logro.tipo !== 'ejecucion') throw new Error('no son de ejecución');
    const m = ejecutar('open("lecturas.txt")', { archivos: proyecto() });
    const foto = (extra: object) => ({ fase: m.estado, error: m.error, salida: m.salida, corrio: null, ...extra }) as never;
    expect(archivo.logro.comprueba(foto({}), '')).toBe(true);
    const solo = ejecutar(CLIMA_BIEN, { archivo: MODULO });
    const fotoModulo = (corrio: string | null) => ({ fase: solo.estado, error: null, salida: solo.salida, corrio }) as never;
    expect(modulo.logro.comprueba(fotoModulo(MODULO), '')).toBe(true);
    expect(modulo.logro.comprueba(fotoModulo(null), '')).toBe(false);
  });
});

describe('el manual dice la verdad sobre el motor', () => {
  it.each(Object.entries(MANUAL_INTERMEDIO))('%s', (_id, ficha) => {
    const m = ejecutar(ficha.programa.join('\n'), { entradas: ficha.tecleado, archivos: ficha.archivos });
    expect(m.error).toBeNull();
    expect(m.salida).toEqual(ficha.consola);
  });

  it('ninguna ficha habla de temperaturas, lecturas, climas ni reportes', () => {
    for (const ficha of Object.values(MANUAL_INTERMEDIO)) {
      const todo = [...ficha.programa, ...Object.keys(ficha.archivos ?? {}), ...Object.values(ficha.archivos ?? {})].join('\n');
      expect(todo).not.toMatch(/clima|lectura|maxima|máxima|clasifica|reporte|estacion|umbral/i);
    }
  });
});

describe('ningún encargo dicta código', () => {
  const DICTA = /print\s*\(|open\s*\(|\.write\s*\(|\.split\s*\(|def\s+\w+\s*\(|import\s+\w+\s*$|\w+\s*=\s*["\w[{(]|for\s+\w+\s+in\b/m;
  it('ni instrucciones, ni pistas de los encargos', () => {
    for (const paso of CLASE.guion.pasos) {
      for (const t of [paso.instruccion, paso.pista]) expect(t).not.toMatch(DICTA);
    }
  });
  it('ni las pistas de los problemas', () => {
    for (const p of PROBLEMAS_INTERMEDIO) for (const t of p.pistas) expect(t).not.toMatch(DICTA);
  });
});
