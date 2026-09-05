/**
 * Estudio de impacto — el motor del cuestionario.
 *
 * Lo que se prueba aquí son las reglas del encargo que, si se rompen, no dan
 * ningún síntoma visible: el cuestionario sigue apareciendo bonito y los datos
 * salen mal. Un cuestionario que se repite, un orden que se baraja o un doble
 * clic que escribe dos filas no rompen ninguna pantalla — rompen el estudio.
 */

import {
  avanceInicial,
  evaluar,
  progreso,
  registrarRespuesta,
  repartoDificultad,
  siguienteReactivo,
  validarBanco,
  yaAplicado,
} from '@/lib/estudio/cuestionario/motor';
import type { Cuestionario } from '@/lib/estudio/cuestionario/tipos';

const BANCO: Cuestionario = {
  id: 'entrada',
  version: 'v1',
  titulo: 'Antes de empezar',
  instrucciones: 'Antes de empezar queremos saber qué ya sabes.',
  cierre: 'Gracias, ya puedes continuar.',
  reactivos: [
    {
      tipo: 'opcion_multiple',
      id: 'R1',
      enunciado: 'Uno',
      opciones: ['a', 'b', 'c', 'd'],
      correctaIdx: 2,
      competencia: 'comp_a',
      dificultad: 'facil',
    },
    {
      tipo: 'opcion_multiple',
      id: 'R2',
      enunciado: 'Dos',
      opciones: ['a', 'b', 'c', 'd'],
      correctaIdx: 0,
      competencia: 'comp_b',
      dificultad: 'media',
    },
    {
      tipo: 'escala',
      id: 'A1',
      enunciado: '¿Qué tanto te gusta?',
      etiquetas: ['Nada', 'Poco', 'Algo', 'Bastante', 'Mucho'],
      competencia: 'actitud',
    },
  ],
};

const IDENT = '11111111-1111-4111-8111-111111111111';
const T0 = '2026-09-05T10:00:00.000Z';

function nuevo() {
  return avanceInicial(BANCO, IDENT, T0);
}

describe('el orden de los reactivos es fijo', () => {
  it('entrega los reactivos en el orden del banco, no barajados', () => {
    let avance = nuevo();
    const vistos: string[] = [];
    for (let i = 0; i < BANCO.reactivos.length; i += 1) {
      const s = siguienteReactivo(BANCO, avance)!;
      vistos.push(s.reactivo.id);
      avance = registrarRespuesta(BANCO, avance, {
        reactivoId: s.reactivo.id,
        respuesta: 0,
        tiempoMs: 1000,
        orden: s.orden,
        ahoraIso: T0,
      });
    }
    expect(vistos).toEqual(['R1', 'R2', 'A1']);
  });

  it('el número de orden que reporta es la posición 1-based en el banco', () => {
    const avance = nuevo();
    expect(siguienteReactivo(BANCO, avance)!.orden).toBe(1);
    const conUna = registrarRespuesta(BANCO, avance, {
      reactivoId: 'R1', respuesta: 0, tiempoMs: 10, orden: 1, ahoraIso: T0,
    });
    expect(siguienteReactivo(BANCO, conUna)!.orden).toBe(2);
  });
});

describe('no se reinicia ni se repite', () => {
  it('al volver, continúa por el reactivo donde se quedó', () => {
    const avance = registrarRespuesta(BANCO, nuevo(), {
      reactivoId: 'R1', respuesta: 1, tiempoMs: 5000, orden: 1, ahoraIso: T0,
    });
    // Esto es «cerró la pestaña y volvió»: el mismo avance, otra sesión.
    expect(siguienteReactivo(BANCO, avance)!.reactivo.id).toBe('R2');
    expect(progreso(BANCO, avance)).toEqual({ contestados: 1, total: 3 });
  });

  it('un doble clic en el mismo reactivo NO escribe dos respuestas', () => {
    const uno = registrarRespuesta(BANCO, nuevo(), {
      reactivoId: 'R1', respuesta: 1, tiempoMs: 5000, orden: 1, ahoraIso: T0,
    });
    const dos = registrarRespuesta(BANCO, uno, {
      reactivoId: 'R1', respuesta: 3, tiempoMs: 60, orden: 1, ahoraIso: T0,
    });
    expect(dos).toBe(uno); // el mismo objeto: no hubo cambio
    expect(dos.respuestas).toHaveLength(1);
    expect(dos.respuestas[0].respuesta).toBe(1); // gana la primera, no la última
  });

  it('un cuestionario terminado queda marcado como aplicado', () => {
    let avance = nuevo();
    for (const r of BANCO.reactivos) {
      avance = registrarRespuesta(BANCO, avance, {
        reactivoId: r.id, respuesta: 0, tiempoMs: 100, orden: 1, ahoraIso: T0,
      });
    }
    expect(avance.completado).toBe(true);
    expect(avance.fin).toBe(T0);
    expect(yaAplicado(avance)).toBe(true);
    expect(siguienteReactivo(BANCO, avance)).toBeNull();
  });

  it('un avance a medias no cuenta como aplicado', () => {
    const avance = registrarRespuesta(BANCO, nuevo(), {
      reactivoId: 'R1', respuesta: 0, tiempoMs: 100, orden: 1, ahoraIso: T0,
    });
    expect(yaAplicado(avance)).toBe(false);
    expect(avance.fin).toBeNull();
  });

  it('quitar un reactivo del banco no descoloca a quien iba a medias', () => {
    const avance = registrarRespuesta(BANCO, nuevo(), {
      reactivoId: 'R1', respuesta: 0, tiempoMs: 100, orden: 1, ahoraIso: T0,
    });
    const bancoRecortado: Cuestionario = { ...BANCO, reactivos: BANCO.reactivos.slice(1) };
    // R1 ya no existe; lo siguiente sigue siendo R2, no se repite nada.
    expect(siguienteReactivo(bancoRecortado, avance)!.reactivo.id).toBe('R2');
  });
});

describe('evaluación', () => {
  it('marca correcta o incorrecta en opción múltiple', () => {
    expect(evaluar(BANCO.reactivos[0], 2)).toBe(true);
    expect(evaluar(BANCO.reactivos[0], 0)).toBe(false);
  });

  it('un reactivo de escala NO tiene respuesta correcta: es null, no false', () => {
    // Un `false` aquí significaría «contestó mal» a algo que no se puede
    // contestar mal, y al agregarlo daría una tasa de acierto inventada.
    expect(evaluar(BANCO.reactivos[2], 4)).toBeNull();
    expect(evaluar(BANCO.reactivos[2], 0)).toBeNull();
  });

  it('saltar un reactivo de opción múltiple cuenta como no acertado', () => {
    expect(evaluar(BANCO.reactivos[0], null)).toBe(false);
  });

  it('un tiempo negativo (reloj cambiado a media sesión) se acota a cero', () => {
    const a = registrarRespuesta(BANCO, nuevo(), {
      reactivoId: 'R1', respuesta: 0, tiempoMs: -9000, orden: 1, ahoraIso: T0,
    });
    expect(a.respuestas[0].tiempoMs).toBe(0);
  });
});

describe('el motor no filtra retroalimentación', () => {
  it('nada de lo que devuelve dice si se acertó', () => {
    const avance = registrarRespuesta(BANCO, nuevo(), {
      reactivoId: 'R1', respuesta: 2, tiempoMs: 100, orden: 1, ahoraIso: T0,
    });
    // `progreso` es lo único que la interfaz enseña, y sólo cuenta.
    expect(Object.keys(progreso(BANCO, avance))).toEqual(['contestados', 'total']);
    const s = siguienteReactivo(BANCO, avance)!;
    expect(Object.keys(s)).toEqual(['reactivo', 'orden']);
  });
});

describe('validarBanco caza los JSON mal escritos', () => {
  it('un banco correcto no tiene problemas', () => {
    expect(validarBanco(BANCO)).toEqual([]);
  });

  it('detecta correctaIdx fuera de rango', () => {
    const malo: Cuestionario = {
      ...BANCO,
      reactivos: [{ ...BANCO.reactivos[0], correctaIdx: 9 } as never],
    };
    expect(validarBanco(malo)).toContainEqual({ reactivoId: 'R1', problema: 'correctaIdx 9 fuera de rango' });
  });

  it('detecta ids repetidos', () => {
    const malo: Cuestionario = { ...BANCO, reactivos: [BANCO.reactivos[0], BANCO.reactivos[0]] };
    expect(validarBanco(malo)).toContainEqual({ reactivoId: 'R1', problema: 'id repetido' });
  });

  it('detecta opciones repetidas y opciones vacías', () => {
    const repetidas: Cuestionario = {
      ...BANCO,
      reactivos: [{ ...BANCO.reactivos[0], opciones: ['a', 'a', 'c', 'd'] } as never],
    };
    expect(validarBanco(repetidas)).toContainEqual({ reactivoId: 'R1', problema: 'opciones repetidas' });

    const vacia: Cuestionario = {
      ...BANCO,
      reactivos: [{ ...BANCO.reactivos[0], opciones: ['a', '  ', 'c', 'd'] } as never],
    };
    expect(vacia && validarBanco(vacia)).toContainEqual({ reactivoId: 'R1', problema: 'alguna opción vacía' });
  });

  it('detecta un reactivo sin competencia asociada', () => {
    const malo: Cuestionario = {
      ...BANCO,
      reactivos: [{ ...BANCO.reactivos[0], competencia: '' } as never],
    };
    expect(validarBanco(malo)).toContainEqual({ reactivoId: 'R1', problema: 'sin competencia asociada' });
  });
});

describe('repartoDificultad', () => {
  it('cuenta sólo los de opción múltiple', () => {
    expect(repartoDificultad(BANCO)).toEqual({ facil: 1, media: 1, dificil: 0 });
  });
});
