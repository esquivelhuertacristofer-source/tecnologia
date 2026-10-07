/**
 * El juez de programas (§68.4) y los tres problemas de «Entrada y salida».
 *
 * Tres cosas que vigila esta prueba y que ninguna otra puede:
 *
 * 1. **Que las salidas literales sean ciertas con el intérprete**, no sólo con
 *    CPython (donde se midieron): si las dos máquinas discrepan, el alumno ve
 *    un caso que pasa en su consola y falla en el juez.
 * 2. **Que cada señuelo caiga donde la tabla de §68.4 dice**, porque un caso
 *    oculto que no distingue nada es un caso de adorno.
 * 3. **Que cada ficha del manual diga la verdad sobre el motor** (regla de
 *    §68.1: una afirmación sin prueba es un comentario).
 */

import { ejecutar } from '@/components/simuladores/codigo/maquina';
import { celdasDe, recortarCelda } from '@/components/simuladores/codigo/celdas';
import {
  juzgarCasoPrograma,
  juzgarPrograma,
  lineasImpresas,
  revisarProblemaPrograma,
  type ProblemaPrograma,
} from '@/components/simuladores/juez';
import {
  CELDAS_ENTRADA_Y_SALIDA,
  MANUAL_ENTRADA_Y_SALIDA,
  P1,
  P2,
  P3,
  PROBLEMAS_ENTRADA_Y_SALIDA,
} from '@/components/activities/python/problemasEntradaYSalida';
import { CLASE, PLANTILLA } from '@/components/activities/python/LabEntradaYSalida';

const py = (...l: string[]) => l.join('\n');

/** Pone un programa debajo de la marca de su celda, dentro de la plantilla de la clase. */
function enCelda(celda: string, programa: string, plantilla = PLANTILLA): string {
  const lineas = plantilla.split('\n');
  const i = lineas.findIndex((l) => l.startsWith(`# %% ${celda}`));
  if (i === -1) throw new Error(`la plantilla no tiene la celda ${celda}`);
  lineas.splice(i + 1, 0, ...programa.split('\n'));
  return lineas.join('\n');
}

const REFERENCIA: Record<string, string> = {
  [P1.id]: py('edad = int(input("¿Cuántos años tienes? "))', 'print(f"El año que viene cumples {edad + 1}.")'),
  [P2.id]: py(
    'nombre = input("¿Cómo te llamas? ")',
    'anio = int(input("¿En qué año naciste? "))',
    'print(f"{nombre}, en 2030 cumples {2030 - anio} años.")',
  ),
  [P3.id]: py(
    'precio = float(input("Precio de una pieza: "))',
    'piezas = int(input("¿Cuántas piezas? "))',
    'print(f"Pagas {precio * piezas} pesos.")',
  ),
};

function porCaso(p: ProblemaPrograma, fuente: string) {
  return juzgarPrograma(p, fuente).casos.map((c) => ({ nombre: c.nombre, oculto: c.oculto, clase: c.clase }));
}

describe('la máquina apunta los ecos de input', () => {
  it('con cola de respuestas y contestando a mano, y lineasImpresas los quita', () => {
    const m = ejecutar(py('a = input("Uno: ")', 'print("hola", a)', 'b = input()', 'print(b)'), { entradas: ['x', 'y'] });
    expect(m.salida).toEqual(['Uno: x', 'hola x', 'y', 'y']);
    expect(m.ecos).toEqual([0, 2]);
    expect(lineasImpresas(m.salida, m.ecos)).toEqual(['hola x', 'y']);
  });
});

describe('las celdas # %%', () => {
  const texto = py('# cabeza', '# %% Problema 1 · uno', 'print(1)', '# %% Problema 12', 'print(12)', '# %% Problema 2', 'print(2)');

  it('se encuentran en orden y «Problema 1» no se come a «Problema 12»', () => {
    expect(celdasDe(texto).map((c) => c.nombre)).toEqual(['Problema 1 · uno', 'Problema 12', 'Problema 2']);
    expect(recortarCelda(texto, 'Problema 1')).toBe(py('', '# %% Problema 1 · uno', 'print(1)', '', '', '', ''));
    expect(recortarCelda(texto, 'Problema 12')).toBe(py('', '', '', '# %% Problema 12', 'print(12)', '', ''));
    expect(recortarCelda(texto, 'Problema 3')).toBeNull();
  });

  it('recortar no mueve las líneas: un error de la celda sale con la línea del editor', () => {
    const v = juzgarCasoPrograma({ nombre: 'x', entradas: [], esperada: ['1'] }, py('print(1)', '# %% A', 'print(zeta)'), 'A');
    expect(v.clase).toBe('error');
    expect(v.linea).toBe(3);
    expect(v.explicacion).toContain('celda «A»');
  });

  it('la plantilla de la clase trae una celda por cada una que nombran los problemas y los encargos', () => {
    const nombres = new Set([...PROBLEMAS_ENTRADA_Y_SALIDA.map((p) => p.celda), ...Object.values(CELDAS_ENTRADA_Y_SALIDA)]);
    for (const n of nombres) expect(recortarCelda(PLANTILLA, n as string)).not.toBeNull();
  });
});

describe('los tres problemas están bien escritos', () => {
  it.each(PROBLEMAS_ENTRADA_Y_SALIDA.map((p) => [p.id, p] as const))('%s', (_id, p) => {
    expect(revisarProblemaPrograma(p)).toEqual([]);
  });

  it('la revisión caza un enunciado que dicta y un caso al que le falta un dato', () => {
    const malo: ProblemaPrograma = {
      ...P1,
      enunciado: 'Escribe edad = int(input("Edad: ")) y súmale uno.',
      casos: [...P1.casos.slice(0, 3), { nombre: 'sin dato', entradas: [], esperada: ['x'], oculto: true }],
    };
    const quejas = revisarProblemaPrograma(malo);
    expect(quejas.some((q) => q.includes('lleva código'))).toBe(true);
    expect(quejas.some((q) => q.includes('no trae un dato'))).toBe(true);
  });
});

describe('las referencias se aceptan con el intérprete, solas y dentro de la plantilla', () => {
  it.each(PROBLEMAS_ENTRADA_Y_SALIDA.map((p) => [p.id, p] as const))('%s', (id, p) => {
    expect(juzgarPrograma(p, enCelda(p.celda as string, REFERENCIA[id])).aceptado).toBe(true);
  });

  it('las tres juntas en su celda, con un calentamiento que pregunta otra cosa encima', () => {
    let texto = enCelda('Calentamiento', py('n = input("¿Nombre? ")', 'print("Hola", n)'));
    for (const p of PROBLEMAS_ENTRADA_Y_SALIDA) texto = enCelda(p.celda as string, REFERENCIA[p.id], texto);
    for (const p of PROBLEMAS_ENTRADA_Y_SALIDA) expect(juzgarPrograma(p, texto).aceptado).toBe(true);
  });

  it('otra estructura también vale: print con comas en el 2 y float para las piezas en el 3', () => {
    const comas = py('n = input()', 'a = int(input())', 'print(n + ",", "en 2030 cumples", 2030 - a, "años.")');
    const flotante = py('p = float(input())', 'c = float(input())', 'print("Pagas", p * c, "pesos.")');
    expect(juzgarPrograma(P2, enCelda('Problema 2', comas)).aceptado).toBe(true);
    expect(juzgarPrograma(P3, enCelda('Problema 3', flotante)).aceptado).toBe(true);
  });
});

describe('los señuelos caen donde dijo CPython (tabla de §68.4)', () => {
  const clases = (p: ProblemaPrograma, programa: string) => porCaso(p, enCelda(p.celda as string, programa)).map((c) => c.clase);

  it('P1 · el 14 escrito a mano pasa el visible y cae en los tres ocultos', () => {
    expect(clases(P1, py('input()', 'print("El año que viene cumples 14.")'))).toEqual(['pasa', 'falla', 'falla', 'falla']);
  });

  it('P1 · la coma de print cae en el VISIBLE, que es donde se ve el espacio de más', () => {
    const v = juzgarPrograma(P1, enCelda('Problema 1', py('e = input()', 'print("El año que viene cumples", int(e) + 1, ".")')));
    expect(v.casos[0].clase).toBe('falla');
    expect(v.casos[0].explicacion).toBe('la respuesta dice «El año que viene cumples 14 .» y tenía que decir «El año que viene cumples 14.»');
  });

  it('P1 · sin convertir se tropieza, con la línea del editor', () => {
    const texto = enCelda('Problema 1', py('e = input()', 'print("El año que viene cumples " + e + 1)'));
    const v = juzgarPrograma(P1, texto);
    expect(v.casos.every((c) => c.clase === 'error')).toBe(true);
    const linea = texto.split('\n').findIndex((l) => l.includes('+ e + 1')) + 1;
    expect(v.casos[0].linea).toBe(linea);
  });

  it('P2 · el año fijo pasa el visible y cae en los ocultos; preguntar al revés cae en el visible', () => {
    expect(clases(P2, py('n = input()', 'input()', 'print(f"{n}, en 2030 cumples 18 años.")'))).toEqual(['pasa', 'falla', 'falla', 'falla']);
    expect(clases(P2, py('a = int(input())', 'n = input()', 'print(f"{n}, en 2030 cumples {2030 - a} años.")'))[0]).toBe('error');
  });

  it('P3 · no convertir el precio imprime el texto repetido, en el visible', () => {
    const v = juzgarPrograma(P3, enCelda('Problema 3', py('p = input()', 'c = int(input())', 'print("Pagas", p * c, "pesos.")')));
    expect(v.casos[0].clase).toBe('falla');
    expect(v.casos[0].obtenida).toEqual(['Pagas 12.512.512.5 pesos.']);
  });

  it('P3 · int al precio se tropieza y round cae en el visible; el 37.5 fijo, en los ocultos', () => {
    expect(clases(P3, py('p = int(input())', 'c = int(input())', 'print("Pagas", p * c, "pesos.")'))[0]).toBe('error');
    expect(clases(P3, py('p = float(input())', 'c = int(input())', 'print("Pagas", round(p * c), "pesos.")'))[0]).toBe('falla');
    expect(clases(P3, py('input()', 'input()', 'print("Pagas 37.5 pesos.")'))).toEqual(['pasa', 'falla', 'falla', 'falla']);
  });
});

describe('el contrato de lectura', () => {
  it('pedir un dato de más es «pide-de-mas», dicho con números, y el oculto no dice nada más', () => {
    const v = juzgarPrograma(P1, enCelda('Problema 1', py('e = int(input())', 'otra = input()', 'print(f"El año que viene cumples {e + 1}.")')));
    expect(v.casos[0].clase).toBe('pide-de-mas');
    expect(v.casos[0].explicacion).toBe('tu programa pidió un 2.º dato y este caso sólo trae un dato');
    expect(v.casos[1].explicacion).toBe('con estos datos tu programa pide más datos de los que hay');
  });

  it('dejar un dato sin leer suspende aunque lo impreso cuadre', () => {
    const v = juzgarCasoPrograma(P2.casos[0], enCelda('Problema 2', py('n = input()', 'print("Ana, en 2030 cumples 18 años.")')), 'Problema 2');
    expect(v.clase).toBe('falla');
    expect(v.explicacion).toBe('tu programa leyó un dato y este caso trae 2 datos');
  });

  it('el texto de la pregunta es libre, pero un print de más cuenta', () => {
    const libre = py('e = int(input("EDAD >>> "))', 'print(f"El año que viene cumples {e + 1}.")');
    expect(juzgarPrograma(P1, enCelda('Problema 1', libre)).aceptado).toBe(true);
    const depuracion = py('e = int(input())', 'print("depurando", e)', 'print(f"El año que viene cumples {e + 1}.")');
    const v = juzgarPrograma(P1, enCelda('Problema 1', depuracion));
    expect(v.casos[0].explicacion).toBe('la línea 1 dice «depurando 13» y tenía que decir «El año que viene cumples 14.»');
  });

  it('borrar la marca de la celda se dice con palabras, y la celda vacía también', () => {
    const sinMarca = PLANTILLA.replace('# %% Problema 1 · El año que viene', '# Problema 1');
    expect(juzgarPrograma(P1, sinMarca).casos[0].explicacion).toContain('no encuentro en tu archivo la línea «# %% Problema 1»');
    expect(juzgarPrograma(P1, PLANTILLA).casos[0].explicacion).toBe('tu programa no imprimió nada, y este caso esperaba una línea');
  });

  it('un bucle sin fin da «no termina»', () => {
    expect(juzgarPrograma(P1, enCelda('Problema 1', py('while True:', '    x = 1'))).casos[0].clase).toBe('no-termina');
  });

  it('ningún caso oculto sale con sus datos', () => {
    const v = juzgarPrograma(P2, enCelda('Problema 2', py('n = input()', 'print(n)')));
    for (const c of v.casos.filter((x) => x.oculto)) {
      expect(c.esperada).toBeNull();
      expect(c.obtenida).toBeNull();
      expect(c.explicacion).not.toMatch(/María|Leo|Rosa|\d/);
    }
  });
});

describe('el manual dice la verdad sobre el motor', () => {
  it.each(Object.entries(MANUAL_ENTRADA_Y_SALIDA))('%s', (_id, ficha) => {
    const m = ejecutar(ficha.programa.join('\n'), { entradas: ficha.tecleado });
    expect(m.estado).toBe('terminada');
    expect(m.salida).toEqual(ficha.consola);
  });

  it('ninguna ficha es del tema de su problema (no puede ser la solución con otro nombre)', () => {
    for (const p of PROBLEMAS_ENTRADA_Y_SALIDA) {
      const ficha = MANUAL_ENTRADA_Y_SALIDA[p.id];
      expect(ficha).toBeDefined();
      const programa = ficha.programa.join('\n');
      for (const c of p.casos) expect(programa).not.toContain(c.esperada[0].split(' ')[0] === 'Pagas' ? 'Pagas' : c.esperada[0]);
      expect(programa).not.toMatch(/2030|cumples|Pagas|pesos/);
    }
  });

  it('la pregunta de cierre describe lo que de verdad pasa: el texto se repite', () => {
    const v = juzgarPrograma(P3, enCelda('Problema 3', py('p = input()', 'c = int(input())', 'print(f"Pagas {p * c} pesos.")')));
    expect(v.casos[0].obtenida).toEqual(['Pagas 12.512.512.5 pesos.']);
    const cierre = CLASE.guion.pasos[CLASE.guion.pasos.length - 1];
    expect(cierre.logro.tipo).toBe('eleccion');
    expect(cierre.instruccion).toContain('Pagas 12.512.512.5 pesos.');
  });
});

describe('ningún encargo dicta código', () => {
  it('ninguna instrucción trae una asignación con input ni una llamada escrita', () => {
    for (const paso of CLASE.guion.pasos) {
      expect(paso.instruccion).not.toMatch(/\w+\s*=\s*(int|float)?\(?\s*input\s*\(/);
      expect(paso.instruccion).not.toMatch(/print\s*\(/);
      expect(paso.pista).not.toMatch(/print\s*\(|input\s*\(\s*"/);
    }
  });
});
