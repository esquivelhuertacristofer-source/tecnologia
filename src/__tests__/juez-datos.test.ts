/**
 * El juez y los seis problemas de `n9-datos-con-python` (§68.3).
 *
 * Gemela de `juez-busqueda.test.ts`:
 *
 * 1. **Las salidas literales son las del intérprete.** Se midieron antes con
 *    CPython 3.14; aquí se vuelven a medir con el intérprete de Tecnia Código,
 *    corriendo una solución de referencia por problema que tiene que salir
 *    ACEPTADA. Si las dos mediciones no coinciden, el intérprete enseña algo
 *    falso (así apareció el `round` que redondeaba `x * 10^n`).
 * 2. **Cada señuelo pasa TODO lo visible y cae en un oculto.** Son los siete
 *    errores de la tabla de §68.3, y el del cero es el centro de la clase.
 * 3. **Sumar el `None` es un tropiezo con la línea del alumno**, no una
 *    respuesta equivocada.
 */

import { juzgar, limpiarRegistro, revisarProblema, type Problema } from '@/components/simuladores/juez';
import { D1, D2, D3, D4, D5, D6, PROBLEMAS_DATOS } from '@/components/activities/datos/problemasDatos';

const py = (...l: string[]) => l.join('\n');

const REFERENCIA: Readonly<Record<string, string>> = {
  [D1.id]: py(
    'def con_calificacion(registros):',
    '    n = 0',
    '    for r in registros:',
    '        if r["calificacion"] != None:',
    '            n = n + 1',
    '    return n',
  ),
  [D2.id]: py(
    'def promedio(registros):',
    '    suma = 0',
    '    n = 0',
    '    for r in registros:',
    '        if r["calificacion"] != None:',
    '            suma = suma + r["calificacion"]',
    '            n = n + 1',
    '    if n == 0:',
    '        return None',
    '    return round(suma / n, 1)',
  ),
  [D3.id]: py(
    'def reprobados(registros, minima):',
    '    nombres = []',
    '    for r in registros:',
    '        if r["calificacion"] != None and r["calificacion"] < minima:',
    '            nombres.append(r["nombre"])',
    '    return nombres',
  ),
  [D4.id]: py(
    'def mejor(registros):',
    '    nombre = "nadie"',
    '    alta = None',
    '    for r in registros:',
    '        c = r["calificacion"]',
    '        if c != None:',
    '            if alta == None or c > alta:',
    '                alta = c',
    '                nombre = r["nombre"]',
    '    return nombre',
  ),
  [D5.id]: py(
    'def por_nivel(registros):',
    '    bajos = 0',
    '    medios = 0',
    '    altos = 0',
    '    for r in registros:',
    '        c = r["calificacion"]',
    '        if c != None:',
    '            if c < 6:',
    '                bajos = bajos + 1',
    '            elif c < 9:',
    '                medios = medios + 1',
    '            else:',
    '                altos = altos + 1',
    '    return [bajos, medios, altos]',
  ),
  /* El 6 reutiliza el 1 y el 3, como dice su tercera pista: sólo se acepta si
   * conviven en el archivo, y la prueba de «todas juntas» lo comprueba. */
  [D6.id]: py(
    'def conclusion(registros, minima):',
    '    n = con_calificacion(registros)',
    '    if n == 0:',
    '        return "sin datos"',
    '    if len(reprobados(registros, minima)) > n / 2:',
    '        return "reforzar"',
    '    return "va bien"',
  ),
};

const TODO = PROBLEMAS_DATOS.map((p) => REFERENCIA[p.id]).join('\n\n');

/** El error típico de cada problema: los de la tabla de §68.3. */
const SENUELO: { problema: Problema; porque: string; fuente: string }[] = [
  {
    problema: D1,
    porque: 'pregunta si la calificación «vale algo» y el cero no cuenta',
    fuente: py(
      'def con_calificacion(registros):',
      '    n = 0',
      '    for r in registros:',
      '        if r["calificacion"]:',
      '            n = n + 1',
      '    return n',
    ),
  },
  {
    problema: D2,
    porque: 'divide entre todos, también los que no entregaron',
    fuente: py(
      'def promedio(registros):',
      '    suma = 0',
      '    for r in registros:',
      '        if r["calificacion"] != None:',
      '            suma = suma + r["calificacion"]',
      '    if len(registros) == 0:',
      '        return None',
      '    return round(suma / len(registros), 1)',
    ),
  },
  {
    problema: D3,
    porque: 'deja fuera a quien saca justo la mínima con «menor o igual»',
    fuente: py(
      'def reprobados(registros, minima):',
      '    nombres = []',
      '    for r in registros:',
      '        if r["calificacion"] != None and r["calificacion"] <= minima:',
      '            nombres.append(r["nombre"])',
      '    return nombres',
    ),
  },
  {
    problema: D4,
    porque: 'lee la posición del máximo en la lista original, desalineada',
    fuente: py(
      'def mejor(registros):',
      '    notas = []',
      '    for r in registros:',
      '        if r["calificacion"] != None:',
      '            notas.append(r["calificacion"])',
      '    if len(notas) == 0:',
      '        return "nadie"',
      '    return registros[notas.index(max(notas))]["nombre"]',
    ),
  },
  {
    problema: D4,
    porque: 'se queda con el último de un empate',
    fuente: py(
      'def mejor(registros):',
      '    nombre = "nadie"',
      '    alta = -1',
      '    for r in registros:',
      '        c = r["calificacion"]',
      '        if c != None and c >= alta:',
      '            alta = c',
      '            nombre = r["nombre"]',
      '    return nombre',
    ),
  },
  {
    problema: D5,
    porque: 'pone el 9 en «aprueba»',
    fuente: py(
      'def por_nivel(registros):',
      '    bajos = 0',
      '    medios = 0',
      '    altos = 0',
      '    for r in registros:',
      '        c = r["calificacion"]',
      '        if c != None:',
      '            if c < 6:',
      '                bajos = bajos + 1',
      '            elif c <= 9:',
      '                medios = medios + 1',
      '            else:',
      '                altos = altos + 1',
      '    return [bajos, medios, altos]',
    ),
  },
  {
    problema: D6,
    porque: 'cuenta la mitad sobre el total de la lista',
    fuente: py(
      REFERENCIA[D1.id],
      REFERENCIA[D3.id],
      'def conclusion(registros, minima):',
      '    if con_calificacion(registros) == 0:',
      '        return "sin datos"',
      '    if len(reprobados(registros, minima)) > len(registros) / 2:',
      '        return "reforzar"',
      '    return "va bien"',
    ),
  },
];

beforeEach(() => limpiarRegistro());

describe('los seis problemas del reporte del grupo', () => {
  test.each(PROBLEMAS_DATOS.map((p) => [p.titulo, p] as const))('%s se acepta con la referencia', (_t, p) => {
    const fuente = p.id === D6.id ? TODO : REFERENCIA[p.id];
    const v = juzgar(p, fuente);
    expect(v.casos.filter((c) => c.clase !== 'pasa').map((c) => `${c.nombre}: ${c.explicacion}`)).toEqual([]);
    expect(v.aceptado).toBe(true);
  });

  test('las seis conviven en un mismo archivo, con la plantilla y un print de depuración, y siguen aceptadas', () => {
    const conRuido = py(
      'calificaciones = [{"nombre": "Sofía", "calificacion": 8.5}, {"nombre": "Emilio", "calificacion": None}]',
      '',
      TODO,
      '',
      'print("probando:", promedio(calificaciones))',
    );
    for (const p of PROBLEMAS_DATOS) expect(juzgar(p, conRuido).aceptado).toBe(true);
  });

  test('el problema 6 solo, sin las funciones que reutiliza, no se acepta y dice por qué', () => {
    const v = juzgar(D6, REFERENCIA[D6.id]);
    expect(v.aceptado).toBe(false);
    expect(v.casos[0].clase).toBe('error');
    expect(v.casos[0].explicacion).toMatch(/con_calificacion/);
  });

  test('todos están bien escritos, con más ocultos que visibles', () => {
    for (const p of PROBLEMAS_DATOS) {
      expect(revisarProblema(p)).toEqual([]);
      const ocultos = p.casos.filter((c) => c.oculto).length;
      expect(ocultos).toBeGreaterThan(p.casos.length - ocultos);
    }
  });

  test('ningún enunciado ni ninguna de las dos primeras pistas dicta código', () => {
    for (const p of PROBLEMAS_DATOS) {
      const texto = `${p.enunciado} ${p.pistas[0]} ${p.pistas[1]}`;
      expect(texto).not.toMatch(/\bfor\b|\bwhile\b|\bdef\b|\breturn\b|==|!=|\bif\b|\.append|\[".*"\]|len\(/);
    }
  });

  test('los nombres de los casos ocultos no llevan cifras', () => {
    for (const p of PROBLEMAS_DATOS) for (const c of p.casos.filter((x) => x.oculto)) expect(c.nombre).not.toMatch(/\d/);
  });

  test('hay un cero oculto en cinco de los seis problemas: es el centro de la clase', () => {
    const conCero = PROBLEMAS_DATOS.filter((p) => p.casos.some((c) => c.oculto && /"calificacion": 0\b/.test(c.llamada)));
    expect(conCero).toHaveLength(5);
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

  test('sumar también el None es un tropiezo con la línea del alumno, no una respuesta equivocada', () => {
    const v = juzgar(
      D2,
      py(
        'def promedio(registros):',
        '    suma = 0',
        '    for r in registros:',
        '        suma = suma + r["calificacion"]',
        '    return round(suma / len(registros), 1)',
      ),
    );
    /* Es un caso oculto: el mensaje del intérprete se tacha, pero la línea se
     * conserva, y el nombre del caso ya dice quién lo provocó. */
    const grupo = v.casos.find((c) => c.nombre === 'alguien no entregó');
    expect(grupo?.clase).toBe('error');
    expect(grupo?.linea).toBe(4);
    expect(grupo?.explicacion).toBe('con estos datos tu programa se tropieza');
    expect(v.casos[0].clase).toBe('pasa');
  });

  test('max() sobre los registros enteros tropieza: no sabe comparar un registro con otro', () => {
    const v = juzgar(D4, py('def mejor(registros):', '    return max(registros)["nombre"]'));
    expect(v.casos[0].clase).toBe('error');
    expect(v.casos[0].linea).toBe(2);
  });
});
