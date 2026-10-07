/**
 * «Primeras líneas de Python» sobre el juez de programas con `datos` (§69.22).
 *
 * La primera vez que el juez entra en primaria: cambia el nombre de la caja de
 * arriba de la celda. Las salidas se midieron con CPython
 * (`scratchpad/n7/medir-primeras.py`) y aquí se vuelven a medir con el
 * intérprete; cada señuelo cae donde dijo CPython y cada ficha se ejecuta.
 */

import { ejecutar } from '@/components/simuladores/codigo/maquina';
import { juzgarPrograma, revisarProblemaPrograma, type ProblemaPrograma } from '@/components/simuladores/juez';
import {
  CELDAS_PRIMERAS,
  MANUAL_PRIMERAS,
  P1,
  P2,
  PROBLEMAS_PRIMERAS,
} from '@/components/activities/python/problemasPrimeras';
import { CLASE, PLANTILLA, dijoUnaFraseTuya } from '@/components/activities/python/LabPrimerasLineasPython';
import { recortarCelda } from '@/components/simuladores/codigo/celdas';
import type { Ejecucion } from '@/components/simuladores/codigo/ventana';

/** Mete el programa justo debajo de la caja `nombre = …` de la celda. */
function enCelda(celda: string, programa: string, base = PLANTILLA): string {
  const lineas = base.split('\n');
  const i = lineas.findIndex((l) => l.startsWith(`# %% ${celda}`));
  if (i === -1) throw new Error(`no hay celda ${celda}`);
  const j = lineas.findIndex((l, n) => n > i && /^nombre\s*=/.test(l));
  lineas.splice(j + 1, 0, ...programa.split('\n'));
  return lineas.join('\n');
}

const SI = ['if len(nombre) > 6:', '    print("Tu nombre es largo.")', 'else:', '    print("Tu nombre es corto.")'].join('\n');

const REF: Record<string, string> = {
  [P1.id]: 'print("Mucho gusto,", nombre)',
  [P2.id]: SI,
};

function caidos(p: ProblemaPrograma, programa: string, base = PLANTILLA): string[] {
  return juzgarPrograma(p, enCelda(p.celda as string, programa, base))
    .casos.filter((c) => c.clase !== 'pasa')
    .map((c) => c.nombre);
}

describe('los problemas están bien escritos y la plantilla trae sus celdas y sus cajas', () => {
  it.each(PROBLEMAS_PRIMERAS.map((p) => [p.id, p] as const))('%s', (_id, p) => {
    expect(revisarProblemaPrograma(p)).toEqual([]);
    const celda = recortarCelda(PLANTILLA, p.celda as string) as string;
    expect(celda).toMatch(/^nombre = "Sofi"$/m);
  });

  it('cada encargo con celda la encuentra en la plantilla', () => {
    for (const celda of Object.values(CELDAS_PRIMERAS)) expect(recortarCelda(PLANTILLA, celda)).not.toBeNull();
  });

  it('la plantilla corre entera sin decir nada más que las dos líneas de la computadora', () => {
    const m = ejecutar(PLANTILLA);
    expect(m.estado).toBe('terminada');
    expect(m.salida).toEqual(['Hola, soy tu computadora.', 'Cumplo las líneas de arriba abajo, una por una.']);
  });
});

describe('las referencias, y otras formas de contestar, se aceptan con el intérprete', () => {
  it.each(PROBLEMAS_PRIMERAS.map((p) => [p.id, p] as const))('%s', (id, p) => {
    expect(caidos(p, REF[id])).toEqual([]);
  });

  it('el saludo pegado con + y su espacio también vale', () => {
    expect(caidos(P1, 'print("Mucho gusto, " + nombre)')).toEqual([]);
  });

  it('la pregunta con >= 7, o al revés con <= 6, también vale', () => {
    expect(caidos(P2, SI.replace('> 6', '>= 7'))).toEqual([]);
    expect(
      caidos(P2, ['if len(nombre) <= 6:', '    print("Tu nombre es corto.")', 'else:', '    print("Tu nombre es largo.")'].join('\n')),
    ).toEqual([]);
  });

  it('cambiar Sofi por tu nombre en la caja no cambia nada: el juez pone el suyo', () => {
    const conMiNombre = PLANTILLA.replace('nombre = "Sofi"', 'nombre = "Valentina"');
    expect(caidos(P1, REF[P1.id], conMiNombre)).toEqual([]);
  });
});

describe('los señuelos caen donde dijo CPython (tabla de §69.22)', () => {
  it('1 · el saludo escrito a mano pasa a Sofi y cae en los tres ocultos', () => {
    expect(caidos(P1, 'print("Mucho gusto, Sofi")')).toEqual(['un nombre corto', 'un nombre con espacio', 'un nombre muy largo']);
  });

  it('1 · la caja entre comillas, sin coma o con + sin espacio caen ya en el ejemplo', () => {
    for (const malo of ['print("Mucho gusto, nombre")', 'print("Mucho gusto", nombre)', 'print("Mucho gusto," + nombre)']) {
      expect(caidos(P1, malo)).toContain('Sofi');
    }
  });

  it('2 · la frase a mano cae en Rodrigo y en Maximiliano', () => {
    expect(caidos(P2, 'print("Tu nombre es corto.")')).toEqual(['siete letras justas', 'un nombre muy largo']);
  });

  it('2 · >= 6 cae sólo en Camila; > 7 sólo en Rodrigo', () => {
    expect(caidos(P2, SI.replace('> 6', '>= 6'))).toEqual(['seis letras justas']);
    expect(caidos(P2, SI.replace('> 6', '> 7'))).toEqual(['siete letras justas']);
  });

  it('2 · sin else imprime las dos frases con los largos', () => {
    const sinElse = ['if len(nombre) > 6:', '    print("Tu nombre es largo.")', 'print("Tu nombre es corto.")'].join('\n');
    expect(caidos(P2, sinElse)).toEqual(['siete letras justas', 'un nombre muy largo']);
  });

  it('2 · el else sangrado es un error de sintaxis, y el juez lo dice en todos', () => {
    const mal = ['if len(nombre) > 6:', '    print("Tu nombre es largo.")', '    else:', '    print("Tu nombre es corto.")'].join('\n');
    const v = juzgarPrograma(P2, enCelda('Problema 2', mal));
    expect(v.aceptado).toBe(false);
    expect(v.casos.every((c) => c.clase === 'error')).toBe(true);
  });

  it('2 · la decisión escrita en la celda del saludo no existe para el juez del Problema 2', () => {
    const enLaOtra = enCelda('Problema 1', `${REF[P1.id]}\n${SI}`);
    expect(juzgarPrograma(P2, enLaOtra).aceptado).toBe(false);
  });
});

describe('las exploraciones juzgan la meta, no la línea', () => {
  const corrida = (salida: string[], fase: Ejecucion['fase'] = 'terminada'): Ejecucion =>
    ({ salida, fase, error: null }) as unknown as Ejecucion;
  const suyas = ['Hola, soy tu computadora.', 'Cumplo las líneas de arriba abajo, una por una.'];

  it('la frase tuya: una tercera línea que no es de la computadora', () => {
    expect(dijoUnaFraseTuya(corrida([...suyas, 'Programo yo']))).toBe(true);
    expect(dijoUnaFraseTuya(corrida(suyas))).toBe(false);
    /* Copiar una de las dos de arriba no es una frase tuya. */
    expect(dijoUnaFraseTuya(corrida([...suyas, suyas[0]]))).toBe(false);
    /* Ni una línea en blanco. */
    expect(dijoUnaFraseTuya(corrida([...suyas, '']))).toBe(false);
    /* Ni un programa que se paró a medias. */
    expect(dijoUnaFraseTuya(corrida([...suyas, 'Programo yo'], 'error'))).toBe(false);
  });

  it('rómpelo pide un error de nombre o de sintaxis; arréglalo, que el juez vuelva a aceptar', () => {
    const paso = (id: string) => CLASE.guion.pasos.find((p) => p.id === id)!;
    const rompe = paso('rompelo').logro;
    if (rompe.tipo !== 'ejecucion') throw new Error('rompelo es de ejecución');
    expect(rompe.comprueba({ fase: 'error', error: { clase: 'nombre' } } as unknown as Ejecucion, '')).toBe(true);
    expect(rompe.comprueba({ fase: 'error', error: { clase: 'tipo' } } as unknown as Ejecucion, '')).toBe(false);
    expect(rompe.comprueba(corrida([]), '')).toBe(false);
    /* Sin enviar al juez, «arreglado» no se da por hecho aunque la caja roja se haya ido. */
    const arregla = paso('arreglalo').logro;
    if (arregla.tipo !== 'ejecucion') throw new Error('arreglalo es de ejecución');
    expect(arregla.comprueba(corrida(['Mucho gusto, Sofi']), enCelda('Problema 1', REF[P1.id]))).toBe(false);
  });
});

describe('el error del encargo 5 habla de lo que pasó', () => {
  it('un texto sin comillas en la caja: la pista nombra las comillas y la caja sin crear', () => {
    const m = ejecutar('nombre = Valentina\nprint("Mucho gusto,", nombre)');
    expect(m.error?.clase).toBe('nombre');
    expect(m.error?.linea).toBe(1);
    expect(m.error?.pista).toContain('entre comillas');
    expect(m.error?.pista).toContain('crearla antes');
  });

  it('fuera de una asignación sigue la pista de siempre, y un nombre parecido gana', () => {
    expect(ejecutar('print(Valentina)').error?.pista).toContain('crearlas antes de usarlas');
    expect(ejecutar('nombre = "Ana"\nprint(nombr)').error?.pista).toContain('«nombre»');
  });
});

describe('el manual dice la verdad sobre el motor', () => {
  it.each(Object.entries(MANUAL_PRIMERAS))('%s', (_id, ficha) => {
    const m = ejecutar(ficha.programa.join('\n'), { entradas: ficha.tecleado });
    expect(m.estado).toBe('terminada');
    expect(m.salida).toEqual(ficha.consola);
  });

  it('ninguna ficha habla de saludos ni de nombres largos o cortos', () => {
    for (const ficha of Object.values(MANUAL_PRIMERAS)) {
      expect(ficha.programa.join('\n')).not.toMatch(/gusto|nombre|largo|corto|Sofi/i);
    }
  });
});

describe('ningún encargo dicta código', () => {
  it('ni print(, ni if con su pregunta, ni len(, ni la caja, en instrucciones o pistas', () => {
    const textos = [
      ...CLASE.guion.pasos.flatMap((p) => [p.instruccion, p.pista]),
      ...PROBLEMAS_PRIMERAS.flatMap((p) => [p.enunciado, ...p.pistas]),
    ];
    for (const t of textos) {
      /* «el if para contestar» es prosa; «if len…» o «if nombre >…» sería la línea. */
      expect(t).not.toMatch(/print\s*\(|\bif\s+(len|nombre|\w+\s*[<>=])|len\s*\(|\w+\s*=\s*["\w]|else\s*:/);
    }
  });
});
