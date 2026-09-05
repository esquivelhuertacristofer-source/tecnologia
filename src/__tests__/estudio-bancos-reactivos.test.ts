/**
 * Estudio de impacto — la calidad de los bancos de reactivos.
 *
 * Estas pruebas no miran código: miran los cuatro JSON que van a contestar
 * alumnos de verdad. Un instrumento de medición mal construido no da error, da
 * números, y los números se publican.
 *
 * EL DEFECTO QUE MOTIVÓ LA MITAD DE ESTE ARCHIVO. El banco del examen de
 * posicionamiento que ya existía en la plataforma
 * (`src/lib/posicionamiento/preguntas.ts`) tiene la respuesta correcta en la
 * PRIMERA posición en 17 de sus 20 preguntas. Un alumno que pulse siempre la
 * primera opción saca 85% sin saber nada. Eso no se ve leyendo el archivo —se
 * ve contando—, y por eso se cuenta aquí.
 */

import { todosLosBancos, bancoDe } from '@/lib/estudio/cuestionario/bancos';
import { repartoDificultad, validarBanco } from '@/lib/estudio/cuestionario/motor';
import { esOpcionMultiple } from '@/lib/estudio/cuestionario/tipos';
import type { Cuestionario, ReactivoOpcionMultiple } from '@/lib/estudio/cuestionario/tipos';

const entrada = bancoDe('entrada');
const salida = bancoDe('salida');

const opcionMultiple = (c: Cuestionario): ReactivoOpcionMultiple[] =>
  c.reactivos.filter(esOpcionMultiple);

describe('los cuatro bancos están bien formados', () => {
  it.each(todosLosBancos().map((c) => [c.id, c] as const))(
    '%s pasa validarBanco sin un solo problema',
    (_id, cuestionario) => {
      expect(validarBanco(cuestionario)).toEqual([]);
    },
  );

  it.each(todosLosBancos().map((c) => [c.id, c] as const))(
    '%s declara título, instrucciones y cierre',
    (_id, c) => {
      expect(c.titulo.trim().length).toBeGreaterThan(0);
      expect(c.instrucciones.trim().length).toBeGreaterThan(0);
      expect(c.cierre.trim().length).toBeGreaterThan(0);
    },
  );
});

describe('tamaño y reparto de dificultad', () => {
  it.each([['entrada', entrada], ['salida', salida]] as const)(
    '%s tiene entre 15 y 20 reactivos',
    (_id, c) => {
      expect(opcionMultiple(c).length).toBeGreaterThanOrEqual(15);
      expect(opcionMultiple(c).length).toBeLessThanOrEqual(20);
    },
  );

  it.each([['entrada', entrada], ['salida', salida]] as const)(
    '%s reparte un tercio fáciles, un tercio medios y un tercio difíciles',
    (_id, c) => {
      const total = opcionMultiple(c).length;
      const r = repartoDificultad(c);
      expect(r).toEqual({ facil: total / 3, media: total / 3, dificil: total / 3 });
    },
  );
});

describe('la forma paralela es de verdad paralela', () => {
  it('cada reactivo de salida declara de cuál de entrada es equivalente', () => {
    const idsEntrada = new Set(opcionMultiple(entrada).map((r) => r.id));
    for (const r of opcionMultiple(salida)) {
      expect(r.paraleloDe).toBeDefined();
      expect(idsEntrada.has(r.paraleloDe!)).toBe(true);
    }
  });

  it('cada reactivo de entrada tiene exactamente un paralelo en salida', () => {
    const paralelos = opcionMultiple(salida).map((r) => r.paraleloDe);
    expect(new Set(paralelos).size).toBe(paralelos.length); // sin repetidos
    expect(paralelos.length).toBe(opcionMultiple(entrada).length);
  });

  it('el paralelo comparte competencia y dificultad', () => {
    const porId = new Map(opcionMultiple(entrada).map((r) => [r.id, r]));
    for (const s of opcionMultiple(salida)) {
      const e = porId.get(s.paraleloDe!)!;
      expect(s.competencia).toBe(e.competencia);
      expect(s.dificultad).toBe(e.dificultad);
    }
  });

  it('el paralelo NO repite el enunciado: mismo constructo, otra pregunta', () => {
    const enunciadosEntrada = new Set(opcionMultiple(entrada).map((r) => r.enunciado.trim().toLowerCase()));
    for (const s of opcionMultiple(salida)) {
      expect(enunciadosEntrada.has(s.enunciado.trim().toLowerCase())).toBe(false);
    }
  });

  it('las competencias cubiertas son las mismas en las dos formas', () => {
    const comp = (c: Cuestionario) => [...new Set(opcionMultiple(c).map((r) => r.competencia))].sort();
    expect(comp(salida)).toEqual(comp(entrada));
  });

  it('cada competencia se mide en las tres dificultades', () => {
    for (const c of [entrada, salida]) {
      const porCompetencia = new Map<string, Set<string>>();
      for (const r of opcionMultiple(c)) {
        if (!porCompetencia.has(r.competencia)) porCompetencia.set(r.competencia, new Set());
        porCompetencia.get(r.competencia)!.add(r.dificultad);
      }
      for (const [competencia, dificultades] of porCompetencia) {
        expect([competencia, [...dificultades].sort()]).toEqual([
          competencia,
          ['dificil', 'facil', 'media'],
        ]);
      }
    }
  });
});

describe('el instrumento no se puede pasar sin saber', () => {
  it('la respuesta correcta no se acumula en una posición', () => {
    // Con 18 reactivos y 4 opciones, el reparto perfecto son 4,5 por posición.
    // Se admite entre 3 y 6; el banco de posicionamiento tenía 17 en la 0.
    for (const c of [entrada, salida]) {
      const cuenta = [0, 0, 0, 0];
      for (const r of opcionMultiple(c)) cuenta[r.correctaIdx] += 1;
      for (const n of cuenta) {
        expect(n).toBeGreaterThanOrEqual(3);
        expect(n).toBeLessThanOrEqual(6);
      }
    }
  });

  it('las dos formas no ponen la correcta en la misma posición todo el tiempo', () => {
    // Si entrada y salida coincidieran reactivo a reactivo, el alumno que
    // recuerda «era la tercera» acertaría en la salida sin saber nada.
    const porId = new Map(opcionMultiple(entrada).map((r) => [r.id, r]));
    const coinciden = opcionMultiple(salida).filter(
      (s) => porId.get(s.paraleloDe!)!.correctaIdx === s.correctaIdx,
    ).length;
    expect(coinciden).toBeLessThanOrEqual(opcionMultiple(salida).length / 3);
  });

  it('la opción correcta no es sistemáticamente la más larga', () => {
    /*
     * Una pista clásica: el redactor detalla la correcta y despacha las
     * distractoras. Un alumno espabilado elige la larga y acierta.
     *
     * El listón es 0,35 y no 0,5. Con cuatro opciones, el azar pone la correcta
     * como más larga el 25% de las veces; la primera versión de estos bancos
     * daba 50%, que pasaba un listón de 0,5 y seguía siendo una pista. Se
     * alargaron nueve distractoras hasta bajar al 28%.
     */
    for (const c of [entrada, salida]) {
      const items = opcionMultiple(c);
      const masLarga = items.filter((r) => {
        const largos = r.opciones.map((o) => o.length);
        return largos[r.correctaIdx] === Math.max(...largos);
      }).length;
      expect(masLarga / items.length).toBeLessThanOrEqual(0.35);
    }
  });

  it('ninguna opción se repite dentro del mismo reactivo', () => {
    for (const c of [entrada, salida]) {
      for (const r of opcionMultiple(c)) {
        expect(new Set(r.opciones).size).toBe(4);
      }
    }
  });
});

describe('el tono es neutro: mide, no examina', () => {
  const prohibidas = [/\bexamen\b/i, /\bprueba\b/i, /\bcalificaci[óo]n\b(?!\.)/i, /\bevaluaci[óo]n\b/i, /\btest\b/i];

  it('ni el título ni las instrucciones usan «examen», «prueba» ni «test»', () => {
    for (const c of todosLosBancos()) {
      for (const texto of [c.titulo, c.instrucciones]) {
        for (const re of prohibidas) {
          expect([c.id, texto, re.source, re.test(texto)]).toEqual([c.id, texto, re.source, false]);
        }
      }
    }
  });

  it('las instrucciones avisan de que no hay calificación', () => {
    expect(bancoDe('entrada').instrucciones).toBe(
      'Antes de empezar queremos saber qué ya sabes. No hay calificación. Responde lo que creas.',
    );
    expect(bancoDe('salida').instrucciones).toBe(
      'Queremos ver cómo te fue. No hay calificación. Responde lo que creas.',
    );
  });

  it('el cierre no adelanta ningún resultado', () => {
    for (const c of todosLosBancos()) {
      expect(c.cierre).toBe('Gracias, ya puedes continuar.');
    }
  });
});

describe('la escala de actitud (§7)', () => {
  it('son cuatro preguntas, de 1 a 5, iguales en entrada y salida', () => {
    const e = bancoDe('actitud_entrada');
    const s = bancoDe('actitud_salida');
    expect(e.reactivos).toHaveLength(4);
    expect(s.reactivos).toHaveLength(4);
    // Una escala de actitud SÍ se repite literal: es lo que permite comparar
    // el antes con el después. Las formas paralelas son para conocimiento.
    expect(s.reactivos.map((r) => r.enunciado)).toEqual(e.reactivos.map((r) => r.enunciado));
  });

  it('las cinco etiquetas son nada · poco · algo · bastante · mucho', () => {
    for (const id of ['actitud_entrada', 'actitud_salida'] as const) {
      for (const r of bancoDe(id).reactivos) {
        if (esOpcionMultiple(r)) throw new Error('la escala no lleva opción múltiple');
        expect(r.etiquetas).toEqual(['Nada', 'Poco', 'Algo', 'Bastante', 'Mucho']);
      }
    }
  });

  it('ningún reactivo de actitud tiene respuesta correcta', () => {
    for (const id of ['actitud_entrada', 'actitud_salida'] as const) {
      for (const r of bancoDe(id).reactivos) {
        expect(esOpcionMultiple(r)).toBe(false);
      }
    }
  });
});

describe('las versiones están declaradas', () => {
  it('todos los bancos llevan la misma versión, y no es vacía', () => {
    const versiones = new Set(todosLosBancos().map((c) => c.version));
    expect(versiones.size).toBe(1);
    expect([...versiones][0]).toMatch(/^\d{4}-\d{2}-\d{2}-/);
  });

  it('la versión dice «provisional» mientras la universidad no valide', () => {
    // Cuando se validen los reactivos, se cambia la versión y esta prueba.
    expect([...new Set(todosLosBancos().map((c) => c.version))][0]).toContain('provisional');
  });
});
